import type { Express, Request, Response, NextFunction } from "express";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import Stripe from "stripe";
import { getPrintfulClient } from "./printful";
import { getUncachableStripeClient } from "./stripeClient";
import { validateCart } from "./cart-validation";
import { shopPool, withOrderLock } from "./shop-store";
import { cents, normalizeRates, publicOrder, recipientSchema, type ShopItem, type ShippingRate } from "./shop-domain";
import { shopRuntime } from "./shop-runtime";
import { loadCatalog, loadCatalogColors, loadProduct } from "./catalog";
import { boundedMap } from "./bounded-map";
import { SHOP_EMAIL_CONSENT } from "../shared/shop-email";
import { auth } from "./auth";

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
  const path = req.path.startsWith("/api/shop/checkout/") ? "/api/shop/checkout/:sessionId/verify"
    : req.path.startsWith("/api/shop/catalog-colors/") ? "/api/shop/catalog-colors/:id" : req.path;
  const key = `${req.ip}:${path}`;
  const now = Date.now();
  if (rateLimits.size > 5000) rateLimits.forEach((value, key) => { if (value.until < now) rateLimits.delete(key); });
  const bucket = rateLimits.get(key);
  if (!bucket || bucket.until < now) rateLimits.set(key, { count: 1, until: now + 60000 });
  else if (++bucket.count > 15) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.until - now) / 1000))));
    res.status(429).json({ error: "Please wait a minute before trying again." }); return;
  }
  next();
}
const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) => {
  fn(req, res).catch((error: any) => {
    console.error("[Shop] Request failed", req.path, error.code || error.type || "request_error");
    if (req.path === "/api/shop/checkout" && error instanceof Stripe.errors.StripeError) {
      const fields = ["address", "automatic_tax", "cancel_url", "client_reference_id", "customer", "email",
        "expires_at", "line_items", "metadata", "mode", "name", "payment_intent_data", "shipping",
        "shipping_options", "success_url", "product", "currency", "unit_amount", "tax_behavior", "lookup_key", "images"];
      const field = error.param?.split("[", 1)[0];
      console.error("[Shop] Stripe checkout diagnostic", {
        stage: res.locals.shopCheckoutStage || "unknown",
        parameter: field && fields.includes(field) ? field : "other",
        requestId: error.requestId && /^req_[a-zA-Z0-9]{1,100}$/.test(error.requestId) ? error.requestId : undefined,
      });
    }
    res.status(400).json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Unable to complete this step. Please check your details and try again." });
  });
};

export async function stripePrice(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>, item: ShopItem) {
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

export async function recordShopConsent(client: import("pg").PoolClient, order: { id: string; recipient: { email: string }; marketing_consent_recorded: boolean }, optedIn: boolean, live: boolean) {
  if (!optedIn || !live || order.marketing_consent_recorded) return;
  await client.query(`WITH subscriber AS (
    INSERT INTO shop_subscribers (email, consent_text, unsubscribe_token)
    VALUES ($2,$3,$4)
    ON CONFLICT (email) DO UPDATE SET consent_text=EXCLUDED.consent_text, consented_at=now(),
      unsubscribed_at=NULL, unsubscribe_token=EXCLUDED.unsubscribe_token
    WHERE shop_subscribers.unsubscribed_at IS NOT NULL
  ) UPDATE shop_orders SET marketing_consent_recorded=true WHERE id=$1`,
  [order.id, order.recipient.email.trim().toLowerCase(), SHOP_EMAIL_CONSENT, randomBytes(32).toString("hex")]);
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
    const response = await loadCatalog(printful());
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(response);
  }));
  app.get("/api/shop/products/:id", asyncRoute(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const response = await loadProduct(id, printful());
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(response);
  }));
  app.get("/api/shop/catalog-colors/:id", throttle, asyncRoute(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const colors = await loadCatalogColors(id, printful());
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(colors);
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
    const { quoteId, shippingId, joinEmailList } = z.object({
      quoteId: z.string().uuid(), shippingId: z.string().min(1).max(100), joinEmailList: z.boolean().default(false),
    }).parse(req.body);
    const ownerHash = owner(req, res);
    const result = await withOrderLock(quoteId, async (client, order) => {
      if (order.owner_hash !== ownerHash) { res.status(404).json({ error: "Quote not found" }); return; }
      if (new Date(order.expires_at) < new Date()) { res.status(409).json({ error: "Your shipping quote expired. Please request a new quote." }); return; }
      res.locals.shopCheckoutStage = "stripe_client";
      const stripe = await services.getStripe();
      if (order.stripe_session_id) {
        res.locals.shopCheckoutStage = "retrieve_session";
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        if (session.status !== "open") { res.status(409).json({ error: "Checkout is already completed or expired." }); return; }
        if (order.shipping_id !== shippingId) { res.status(409).json({ error: "Shipping was already selected. Please request a new quote to change it." }); return; }
        await recordShopConsent(client, order, joinEmailList, session.livemode);
        res.json({ url: session.url, sessionId: session.id }); return true;
      }
      if (order.shipping_id && order.shipping_id !== shippingId) {
        res.status(409).json({ error: "Shipping was already selected. Request a new quote to change it." }); return;
      }
      const rate = (order.shipping_rates as ShippingRate[]).find(r => r.id === shippingId);
      if (!rate) throw new Error("Invalid shipping service");
      res.locals.shopCheckoutStage = "estimate_order";
      const estimate = await printful().estimateOrder({
        recipient: order.recipient,
        items: (order.items as ShopItem[]).map(i => ({ sync_variant_id: i.syncVariantId, quantity: i.quantity })),
        shipping: shippingId,
      });
      if (cents(estimate.result?.costs?.total) > order.subtotal + cents(rate.rate)) {
        res.status(409).json({ error: "This order cannot be fulfilled at the quoted price. Please contact the store owner." }); return;
      }
      // Revalidate the exact selected variants and prices immediately before accepting payment.
      res.locals.shopCheckoutStage = "validate_cart";
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
      res.locals.shopCheckoutStage = "create_customer";
      const customer = await stripe.customers.create({
        name: recipient.name, email: recipient.email, address,
        shipping: { name: recipient.name, address },
      }, { idempotencyKey: `shop-customer-${quoteId}` });
      res.locals.shopCheckoutStage = "resolve_prices";
      const lineItems = await boundedMap(items, async item => ({
        price: await stripePrice(stripe, item), quantity: item.quantity,
      }));
      const shippingAmount = cents(rate.rate);
      await client.query("UPDATE shop_orders SET shipping_id=$2,shipping_amount=$3,expected_amount=subtotal+$3 WHERE id=$1", [quoteId, shippingId, shippingAmount]);
      const origin = trustedOrigin(req);
      res.locals.shopCheckoutStage = "create_session";
      const session = await stripe.checkout.sessions.create({
        customer: customer.id, mode: "payment",
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
        payment_intent_data: { metadata: { shop_order_id: quoteId } },
        success_url: `${origin}/studio?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/studio?canceled=true`,
        expires_at: Math.floor(new Date(order.created_at).getTime() / 1000) + 3600,
        metadata: { shop_order_id: quoteId },
      }, { idempotencyKey: `shop-checkout-${quoteId}` });
      await client.query(`UPDATE shop_orders SET stripe_session_id=$2,shipping_id=$3,shipping_amount=$4,
        expected_amount=subtotal+$4,status='awaiting_payment',test_mode=$5,updated_at=now() WHERE id=$1`,
      [quoteId, session.id, shippingId, shippingAmount, !session.livemode]);
      await recordShopConsent(client, order, joinEmailList, session.livemode);
      res.json({ url: session.url, sessionId: session.id });
      return true;
    });
    if (!res.headersSent && result === undefined) res.status(409).json({ error: "Checkout is being prepared. Please try again shortly." });
  }));
  app.get("/api/shop/subscribers.csv", ...auth.ownerReadGuard, asyncRoute(async (_req, res) => {
    const result = await shopPool.query("SELECT email,consented_at,consent_text,unsubscribe_token FROM shop_subscribers WHERE unsubscribed_at IS NULL ORDER BY consented_at");
    const csv = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
    const rows = result.rows.map(row => [
      row.email, new Date(row.consented_at).toISOString(), row.consent_text,
      `https://ethanfryer.com/api/shop/unsubscribe?token=${row.unsubscribe_token}`,
    ].map(csv).join(","));
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="def-subscribers.csv"' });
    res.send(["email,consented_at,consent_text,unsubscribe_url", ...rows].join("\r\n"));
  }));
  app.get("/api/shop/unsubscribe", throttle, (req, res) => {
    const token = typeof req.query.token === "string" && /^[a-f0-9]{64}$/.test(req.query.token) ? req.query.token : "";
    res.set("Referrer-Policy", "no-referrer");
    if (!token) { res.status(400).send("Invalid unsubscribe link."); return; }
    res.type("html").send(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Unsubscribe from D.EF</title><body><main><h1>Unsubscribe from D.EF emails</h1><p>Confirm to stop receiving updates and offers.</p><form method="post" action="/api/shop/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe</button></form></main></body></html>`);
  });
  app.post("/api/shop/unsubscribe", throttle, asyncRoute(async (req, res) => {
    const token = z.string().regex(/^[a-f0-9]{64}$/).parse(req.body.token);
    await shopPool.query("UPDATE shop_subscribers SET unsubscribed_at=COALESCE(unsubscribed_at,now()) WHERE unsubscribe_token=$1", [token]);
    res.set("Referrer-Policy", "no-referrer").type("html").send("<!doctype html><html lang=\"en\"><title>D.EF email preferences</title><body><h1>Unsubscribed</h1><p>You will no longer receive D.EF updates or offers.</p></body></html>");
  }));
  app.post("/api/shop/order-status", throttle, asyncRoute(async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (!/^[a-f0-9]{64}$/.test(token)) { res.status(404).json({ error: "Order status link is invalid." }); return; }
    const hash = createHash("sha256").update(token).digest("hex");
    const result = await shopPool.query(`SELECT o.id,o.status,o.paid,o.test_mode,o.tracking,o.printful_order_id
      FROM shop_receipts r JOIN shop_orders o ON o.id=r.order_id
      WHERE r.status_token_hash=$1 AND o.paid=true`, [hash]);
    const order = result.rows[0];
    if (!order) { res.status(404).json({ error: "Order status link is invalid." }); return; }
    const trackingSchema = z.object({
      number: z.string().trim().min(1), carrier: z.string().nullish(), url: z.string().nullish(),
    });
    const sanitizeTracking = (value: unknown) => {
      const parsed = trackingSchema.safeParse(value);
      if (!parsed.success) return undefined;
      const { number, carrier, url } = parsed.data;
      let safeUrl: string | undefined;
      if (url) {
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.protocol === "https:" && !parsedUrl.username && !parsedUrl.password) safeUrl = parsedUrl.href;
          else console.error("[Shop] Invalid tracking URL", order.id);
        } catch { console.error("[Shop] Invalid tracking URL", order.id); }
      }
      return { number, ...(carrier ? { carrier } : {}), ...(safeUrl ? { url: safeUrl } : {}) };
    };
    let tracking = sanitizeTracking(order.tracking);
    let status = order.status;
    let refreshUnavailable = false;
    if (!order.test_mode && order.printful_order_id && !["canceled", "test_paid"].includes(status)) {
      try {
        const remote = await printful().getOrderByExternalId(`web-${order.id}`);
        const parsed = z.object({ result: z.object({
          status: z.enum(["draft", "pending", "failed", "canceled", "inprocess", "onhold", "partial", "fulfilled"]),
          shipments: z.array(z.object({ tracking_number: z.string().nullish(), tracking_url: z.string().nullish(), carrier: z.string().nullish() })).nullish(),
        }) }).parse(remote);
        const shipment = parsed.result.shipments?.find(item => item.tracking_number?.trim());
        if (shipment) {
          tracking = sanitizeTracking({ number: shipment.tracking_number, carrier: shipment.carrier, url: shipment.tracking_url });
        }
        if (["failed", "canceled", "onhold"].includes(parsed.result.status)) status = "needs_attention";
        if (parsed.result.status === "fulfilled" && ["fulfilled", "shipped"].includes(status)) status = "shipped";
      } catch {
        refreshUnavailable = true;
        console.error("[Shop] Tracking refresh unavailable", order.id);
      }
    }
    res.set({ "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" });
    res.json({ ...publicOrder({ ...order, status, tracking }), tracking, refreshUnavailable });
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
