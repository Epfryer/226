import type { Express, Request, Response, NextFunction } from "express";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { getPrintfulClient } from "./printful";
import { getUncachableStripeClient } from "./stripeClient";
import { validateCart } from "./cart-validation";
import { shopPool, withOrderLock } from "./shop-store";
import { cents, normalizeRates, publicOrder, recipientSchema, type ShopItem, type ShippingRate } from "./shop-domain";
import { shopRuntime } from "./shop-runtime";

function owner(req: Request, res: Response): string {
  const headerToken = req.get("X-Shop-Token");
  const value = headerToken || req.headers.cookie?.split(";").map(c => c.trim()).find(c => c.startsWith("shop_owner="))?.slice(11);
  const token = value && /^[a-f0-9]{64}$/.test(value) ? value : randomBytes(32).toString("hex");
  if (token !== value) res.append("Set-Cookie", `shop_owner=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  return createHash("sha256").update(token).digest("hex");
}

export function trustedOrigin(req: Request) {
  const domains = [process.env.REPLIT_DEV_DOMAIN, ...(process.env.REPLIT_DOMAINS?.split(",") || [])].filter(Boolean);
  const origin = req.headers.origin;
  if (!origin || !domains.some(domain => origin === `https://${domain}`)) throw new Error("Untrusted checkout origin");
  return origin;
}
function guarded(req: Request, res: Response, next: NextFunction) {
  try { trustedOrigin(req); next(); } catch { res.status(403).json({ error: "This request must originate from the store website." }); }
}
const rateLimits = new Map<string, { count: number; until: number }>();
function throttle(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  if (rateLimits.size > 5000) rateLimits.forEach((value, key) => { if (value.until < now) rateLimits.delete(key); });
  const bucket = rateLimits.get(key);
  if (!bucket || bucket.until < now) rateLimits.set(key, { count: 1, until: now + 60000 });
  else if (++bucket.count > 15) { res.status(429).json({ error: "Please wait a minute before trying again." }); return; }
  next();
}
const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) => {
  fn(req, res).catch((error: any) => {
    console.error("[Shop] Request failed", req.path, error.code || error.type || "request_error");
    res.status(400).json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Unable to complete this step. Please check your details and try again." });
  });
};

async function stripePrice(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>, item: ShopItem) {
  // Stripe is the source of truth for its product and price IDs. Printful remains the fulfillment catalog.
  const productId = `pf_variant_${item.syncVariantId}`;
  let product;
  try { product = await stripe.products.retrieve(productId); }
  catch (error: any) {
    if (error.code !== "resource_missing") throw error;
    product = await stripe.products.create({
      id: productId, name: item.name, ...(item.image ? { images: [item.image] } : {}),
      metadata: { printful_sync_variant_id: String(item.syncVariantId) },
    }, { idempotencyKey: `shop-product-${item.syncVariantId}` });
  }
  const lookupKey = `${productId}_usd_${cents(item.price)}`;
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (prices.data[0]) return prices.data[0].id;
  const price = await stripe.prices.create({
    product: product.id, currency: "usd", unit_amount: cents(item.price), tax_behavior: "exclusive", lookup_key: lookupKey,
  }, { idempotencyKey: lookupKey });
  return price.id;
}

export function registerShopRoutes(app: Express, services = {
  getStripe: getUncachableStripeClient, getPrintful: getPrintfulClient, runtime: shopRuntime,
}) {
  const printful = () => services.getPrintful();
  const checkoutReady = (_req: Request, res: Response, next: NextFunction) => {
    if (!services.runtime.ready) { res.status(503).json({ error: services.runtime.message }); return; }
    next();
  };
  app.use("/api/shop", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  app.get("/api/shop/status", (_req, res) => res.json(services.runtime));
  app.get("/api/shop/products", asyncRoute(async (_req, res) => {
    const response = await printful().getProducts();
    res.json(response);
  }));
  app.get("/api/shop/products/:id", asyncRoute(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    res.json(await printful().getProduct(id));
  }));
  app.post("/api/shop/cart/validate", guarded, throttle, asyncRoute(async (req, res) => {
    res.json({ items: await validateCart(req.body.items, id => printful().getSyncVariant(id)) });
  }));
  app.post("/api/shop/quote", guarded, throttle, checkoutReady, asyncRoute(async (req, res) => {
    const recipient = recipientSchema.parse(req.body.recipient);
    const items = await validateCart(req.body.items, id => printful().getSyncVariant(id));
    const rates = normalizeRates(await printful().calculateShipping({
      recipient, items: items.map(item => ({ variant_id: item.variantId, quantity: item.quantity })), currency: "USD",
    }));
    const subtotal = items.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0);
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60000);
    await shopPool.query(`INSERT INTO shop_orders (id,owner_hash,recipient,items,shipping_rates,subtotal,expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, owner(req, res), recipient, JSON.stringify(items), JSON.stringify(rates), subtotal, expiresAt]);
    res.json({ quoteId: id, expiresAt, items, subtotal: subtotal / 100, shippingRates: rates });
  }));
  app.post("/api/shop/checkout", guarded, throttle, checkoutReady, asyncRoute(async (req, res) => {
    const { quoteId, shippingId } = z.object({ quoteId: z.string().uuid(), shippingId: z.string().min(1).max(100) }).parse(req.body);
    const ownerHash = owner(req, res);
    const result = await withOrderLock(quoteId, async (client, order) => {
      if (order.owner_hash !== ownerHash) { res.status(404).json({ error: "Quote not found" }); return; }
      if (new Date(order.expires_at) < new Date()) { res.status(409).json({ error: "Your shipping quote expired. Please request a new quote." }); return; }
      const stripe = await services.getStripe();
      if (order.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        if (session.status !== "open") { res.status(409).json({ error: "Checkout is already completed or expired." }); return; }
        if (order.shipping_id !== shippingId) { res.status(409).json({ error: "Shipping was already selected. Please request a new quote to change it." }); return; }
        res.json({ url: session.url, sessionId: session.id }); return true;
      }
      if (order.shipping_id && order.shipping_id !== shippingId) {
        res.status(409).json({ error: "Shipping was already selected. Request a new quote to change it." }); return;
      }
      const rate = (order.shipping_rates as ShippingRate[]).find(r => r.id === shippingId);
      if (!rate) throw new Error("Invalid shipping service");
      const estimate = await printful().estimateOrder({
        recipient: order.recipient,
        items: (order.items as ShopItem[]).map(i => ({ sync_variant_id: i.syncVariantId, quantity: i.quantity })),
        shipping: shippingId,
      });
      if (cents(estimate.result?.costs?.total) > order.subtotal + cents(rate.rate)) {
        res.status(409).json({ error: "This order cannot be fulfilled at the quoted price. Please contact the store owner." }); return;
      }
      // Revalidate the exact selected variants and prices immediately before accepting payment.
      const items = await validateCart(order.items, id => printful().getSyncVariant(id));
      if (JSON.stringify(items.map(i => [i.syncVariantId, i.price, i.quantity])) !==
        JSON.stringify((order.items as ShopItem[]).map(i => [i.syncVariantId, i.price, i.quantity]))) {
        res.status(409).json({ error: "Product prices changed. Close checkout and request a new quote." }); return;
      }
      const recipient = order.recipient;
      const address = {
        line1: recipient.address1, line2: recipient.address2, city: recipient.city,
        state: recipient.state_code, country: recipient.country_code, postal_code: recipient.zip,
      };
      // Address is collected on our site and fixed to this quote. Stripe cannot change the shipping destination.
      const customer = await stripe.customers.create({
        name: recipient.name, email: recipient.email, address,
        shipping: { name: recipient.name, address },
      }, { idempotencyKey: `shop-customer-${quoteId}` });
      const lineItems = [];
      for (const item of items) lineItems.push({ price: await stripePrice(stripe, item), quantity: item.quantity });
      const shippingAmount = cents(rate.rate);
      await client.query("UPDATE shop_orders SET shipping_id=$2,shipping_amount=$3,expected_amount=subtotal+$3 WHERE id=$1", [quoteId, shippingId, shippingAmount]);
      const origin = trustedOrigin(req);
      const session = await stripe.checkout.sessions.create({
        customer: customer.id, mode: "payment", payment_method_types: ["card"],
        client_reference_id: quoteId,
        line_items: lineItems, automatic_tax: { enabled: true },
        shipping_options: [{ shipping_rate_data: {
          type: "fixed_amount", fixed_amount: { amount: shippingAmount, currency: "usd" },
          display_name: rate.name, tax_behavior: "exclusive",
          ...(rate.minDeliveryDays && rate.maxDeliveryDays ? { delivery_estimate: {
            minimum: { unit: "business_day", value: rate.minDeliveryDays },
            maximum: { unit: "business_day", value: rate.maxDeliveryDays },
          } } : {}),
        } }],
        payment_intent_data: { shipping: { name: recipient.name, address }, metadata: { shop_order_id: quoteId } },
        success_url: `${origin}/studio?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/studio?canceled=true`,
        expires_at: Math.floor(new Date(order.created_at).getTime() / 1000) + 3600,
        metadata: { shop_order_id: quoteId },
      }, { idempotencyKey: `shop-checkout-${quoteId}` });
      await client.query(`UPDATE shop_orders SET stripe_session_id=$2,shipping_id=$3,shipping_amount=$4,
        expected_amount=subtotal+$4,status='awaiting_payment',test_mode=$5,updated_at=now() WHERE id=$1`,
      [quoteId, session.id, shippingId, shippingAmount, !session.livemode]);
      res.json({ url: session.url, sessionId: session.id });
      return true;
    });
    if (!res.headersSent && result === undefined) res.status(409).json({ error: "Checkout is being prepared. Please try again shortly." });
  }));
  // Read-only: a return URL never creates or confirms a physical order.
  app.get("/api/shop/checkout/:sessionId/verify", throttle, asyncRoute(async (req, res) => {
    if (!/^cs_(test_|live_)?[a-zA-Z0-9]+$/.test(req.params.sessionId)) { res.status(404).json({ error: "Order not found" }); return; }
    const result = await shopPool.query("SELECT * FROM shop_orders WHERE stripe_session_id=$1 AND owner_hash=$2", [req.params.sessionId, owner(req, res)]);
    if (!result.rows[0]) { res.status(404).json({ error: "Order not found. Please use the browser that started checkout." }); return; }
    res.json(publicOrder(result.rows[0]));
  }));
  // No public order management or unverified webhook receiver. Owner operations belong in Printful's dashboard.
  app.all(["/api/shop/orders", "/api/shop/orders/*", "/api/shop/webhook"], (_req, res) => {
    res.status(403).json({ error: "Order management is not available through this public website." });
  });
}
