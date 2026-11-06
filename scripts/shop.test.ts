import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import Stripe from "stripe";
import { shopPool } from "../server/shop-store";
import { registerShopRoutes } from "../server/shop-routes";
import { registerPaymentWebhooks } from "../server/shop-webhooks";
import { fulfillOrder } from "../server/shop-fulfillment";
import { normalizeRates, recipientSchema, publicOrder } from "../server/shop-domain";

const created: string[] = [];
const recipient = { name: "Test Shopper", email: "shopper@example.test", address1: "123 Test Street", city: "Los Angeles", state_code: "CA", country_code: "US", zip: "90001" };
const items = [{ syncVariantId: 7, variantId: 77, name: "Test Print", color: "Black", size: "M", price: 30, quantity: 1, image: "" }];
const rate = { id: "STANDARD", name: "Standard", rate: "5.25", currency: "USD" };
const stripeUtil = new Stripe("sk_test_fixture_not_a_real_credential");
after(async () => {
  for (const id of created) await shopPool.query("DELETE FROM shop_orders WHERE id=$1", [id]);
  await shopPool.end();
});
async function fixture(overrides: Record<string, unknown> = {}) {
  const id = randomUUID(); created.push(id);
  await shopPool.query(`INSERT INTO shop_orders
    (id,owner_hash,recipient,items,shipping_rates,subtotal,shipping_amount,shipping_id,expected_amount,stripe_session_id,status,expires_at)
    VALUES ($1,'test-owner',$2,$3,$4,3000,525,'STANDARD',3525,$5,'awaiting_payment',now()+interval '15 minutes')`,
  [id, recipient, JSON.stringify(items), JSON.stringify([rate]), `cs_test_${id.replaceAll("-", "")}`]);
  for (const [field, value] of Object.entries(overrides)) {
    assert.ok(["status", "paid", "attempts", "test_mode"].includes(field));
    await shopPool.query(`UPDATE shop_orders SET ${field}=$2 WHERE id=$1`, [id, value]);
  }
  return id;
}
async function row(id: string) { return (await shopPool.query("SELECT * FROM shop_orders WHERE id=$1", [id])).rows[0]; }
function paidSession(id: string, more: any = {}) {
  return {
    id: `cs_test_${id.replaceAll("-", "")}`, metadata: { shop_order_id: id }, client_reference_id: id,
    payment_status: "paid", status: "complete", currency: "usd", livemode: true,
    amount_subtotal: 3000, amount_total: 3525, total_details: { amount_shipping: 525, amount_tax: 0 },
    payment_intent: { latest_charge: { refunded: false, amount_refunded: 0 } }, ...more,
  };
}
function services(session: any, printful: any) {
  return { getStripe: async () => ({ checkout: { sessions: { retrieve: async () => session } } }) as any, getPrintful: () => printful };
}

test("shipping/address validation rejects malformed input and preserves provider rates", () => {
  assert.throws(() => recipientSchema.parse({ ...recipient, email: "invalid" }));
  assert.throws(() => recipientSchema.parse({ ...recipient, state_code: "" }));
  assert.deepEqual(normalizeRates({ result: [rate] }), [{ ...rate, minDeliveryDays: undefined, maxDeliveryDays: undefined }]);
  assert.throws(() => normalizeRates({ result: [{ ...rate, rate: "-1" }] }));
  assert.throws(() => normalizeRates({ result: [] }));
  assert.equal(publicOrder({ status: "needs_attention", paid: true }).paid, true);
});

test("quote/checkout uses authoritative prices, actual shipping, ownership and replay-safe sessions", async () => {
  let sessionCreates = 0;
  let checkoutParams: any;
  const pf = {
    getSyncVariant: async () => ({ result: { sync_variant: { id: 7, variant_id: 77, synced: true, availability_status: "active", currency: "USD", retail_price: "30.00", name: "Test Print" } } }),
    calculateShipping: async (data: any) => { assert.equal(data.items[0].variant_id, 77); return { result: [rate] }; },
    estimateOrder: async () => ({ result: { costs: { total: "20.00" } } }),
  };
  const stripe = {
    customers: { create: async (params: any) => { assert.equal(params.shipping.address.line1, recipient.address1); return { id: "cus_fixture" }; } },
    products: { retrieve: async () => ({ id: "prod_fixture" }) },
    prices: { list: async () => ({ data: [{ id: "price_fixture" }] }) },
    checkout: { sessions: {
      create: async (params: any) => { sessionCreates++; checkoutParams = params; return { id: "cs_test_fixtureCheckout", url: "https://checkout.stripe.com/test", livemode: false }; },
      retrieve: async () => ({ id: "cs_test_fixtureCheckout", status: "open", url: "https://checkout.stripe.com/test" }),
    } },
  };
  const app = express(); app.use(express.json());
  registerShopRoutes(app, { getPrintful: () => pf as any, getStripe: async () => stripe as any, runtime: { ready: true, testMode: true, message: "Test" } });
  const server = app.listen(0); await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const headers = { "Content-Type": "application/json", Origin: `https://${process.env.REPLIT_DEV_DOMAIN}` };
  try {
    const quoteResponse = await fetch(`${base}/api/shop/quote`, { method: "POST", headers, body: JSON.stringify({ recipient, items: [{ syncVariantId: 7, quantity: 1, price: 0.01 }] }) });
    assert.equal(quoteResponse.status, 200);
    const quote = await quoteResponse.json() as any; created.push(quote.quoteId);
    assert.equal(quote.subtotal, 30); assert.equal(quote.shippingRates[0].rate, "5.25");
    const cookie = quoteResponse.headers.get("set-cookie")!.split(";")[0];
    const checkout = () => fetch(`${base}/api/shop/checkout`, { method: "POST", headers: { ...headers, Cookie: cookie }, body: JSON.stringify({ quoteId: quote.quoteId, shippingId: "STANDARD" }) });
    assert.equal((await checkout()).status, 200);
    assert.equal((await checkout()).status, 200); assert.equal(sessionCreates, 1);
    assert.equal(checkoutParams.line_items[0].price, "price_fixture");
    assert.equal(checkoutParams.shipping_options[0].shipping_rate_data.fixed_amount.amount, 525);
    assert.equal(checkoutParams.automatic_tax.enabled, true);
    assert.equal(checkoutParams.shipping_address_collection, undefined);
    const unauthorized = await fetch(`${base}/api/shop/checkout/cs_test_fixtureCheckout/verify`);
    assert.equal(unauthorized.status, 404);
    const verified = await fetch(`${base}/api/shop/checkout/cs_test_fixtureCheckout/verify`, { headers: { Cookie: cookie } });
    assert.equal((await verified.json() as any).paid, false);
    assert.equal((await fetch(`${base}/api/shop/orders`)).status, 403);
    assert.equal((await fetch(`${base}/api/shop/orders/1/confirm`, { method: "POST" })).status, 403);
    assert.equal((await fetch(`${base}/api/shop/quote`, { method: "POST", headers: { ...headers, Origin: "https://evil.example" }, body: "{}" })).status, 403);
    await shopPool.query("UPDATE shop_orders SET expires_at=now()-interval '1 minute' WHERE id=$1", [quote.quoteId]);
    assert.equal((await checkout()).status, 409);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("test payments never call Printful, unpaid checkouts never fulfill, refunds hold orders", async () => {
  let calls = 0;
  const pf = new Proxy({}, { get() { calls++; throw new Error("Printful must not be used"); } });
  const testId = await fixture();
  await fulfillOrder(testId, services(paidSession(testId, { livemode: false }), pf));
  assert.equal((await row(testId)).status, "test_paid"); assert.equal(calls, 0);
  const unpaid = await fixture();
  await fulfillOrder(unpaid, services(paidSession(unpaid, { payment_status: "unpaid" }), pf));
  assert.equal((await row(unpaid)).paid, false); assert.equal(calls, 0);
  const expired = await fixture();
  await fulfillOrder(expired, services(paidSession(expired, { payment_status: "unpaid", status: "expired" }), pf));
  assert.equal((await row(expired)).status, "canceled");
  const refunded = await fixture();
  await fulfillOrder(refunded, services(paidSession(refunded, { payment_intent: { latest_charge: { refunded: true, amount_refunded: 3525 } } }), pf));
  assert.equal((await row(refunded)).status, "canceled"); assert.equal(calls, 0);
});

test("concurrent/repeated live-mode fixtures create and confirm only one Printful order", async () => {
  const previous = process.env.REPLIT_DEPLOYMENT; process.env.REPLIT_DEPLOYMENT = "1";
  try {
    const id = await fixture(); let remote: any = null; let creates = 0; let confirms = 0;
    const pf = {
      getOrderByExternalId: async (external: string) => { assert.equal(external, `web-${id}`); return remote; },
      createOrder: async (data: any) => {
        creates++; assert.deepEqual(data.recipient, recipient); assert.equal(data.items[0].sync_variant_id, 7);
        await new Promise(r => setTimeout(r, 30));
        remote = { result: { id: 99, status: "draft", costs: { total: "20.00" } } }; return remote;
      },
      confirmOrder: async (remoteId: number) => { confirms++; assert.equal(remoteId, 99); remote.result.status = "pending"; return remote; },
    };
    const deps = services(paidSession(id), pf);
    await Promise.all([fulfillOrder(id, deps), fulfillOrder(id, deps)]);
    await fulfillOrder(id, deps);
    assert.equal(creates, 1); assert.equal(confirms, 1); assert.equal((await row(id)).status, "fulfilled");
  } finally { if (previous === undefined) delete process.env.REPLIT_DEPLOYMENT; else process.env.REPLIT_DEPLOYMENT = previous; }
});

test("lost create/confirm responses recover by external ID without duplicate production", async () => {
  const previous = process.env.REPLIT_DEPLOYMENT; process.env.REPLIT_DEPLOYMENT = "1";
  try {
    const id = await fixture(); let remote: any = null; let creates = 0; let confirms = 0;
    const pf = {
      getOrderByExternalId: async () => remote,
      createOrder: async () => { creates++; remote = { result: { id: 100, status: "draft", costs: { total: "20.00" } } }; throw new Error("Lost HTTP response"); },
      confirmOrder: async () => { confirms++; remote.result.status = "pending"; throw new Error("Lost confirmation response"); },
    };
    const deps = services(paidSession(id), pf);
    await assert.rejects(fulfillOrder(id, deps));
    assert.equal((await row(id)).status, "needs_attention");
    await assert.rejects(fulfillOrder(id, deps));
    await fulfillOrder(id, deps);
    assert.equal(creates, 1); assert.equal(confirms, 1); assert.equal((await row(id)).status, "fulfilled");
  } finally { if (previous === undefined) delete process.env.REPLIT_DEPLOYMENT; else process.env.REPLIT_DEPLOYMENT = previous; }
});

test("incorrect payment totals and high production costs stop fulfillment", async () => {
  const id = await fixture(); let called = false;
  await assert.rejects(fulfillOrder(id, services(paidSession(id, { amount_subtotal: 1 }), { getOrderByExternalId: async () => { called = true; } })));
  assert.equal(called, false); assert.equal((await row(id)).error_code, "amount_mismatch");
  const previous = process.env.REPLIT_DEPLOYMENT; process.env.REPLIT_DEPLOYMENT = "1";
  try {
    const costly = await fixture();
    const pf = {
      getOrderByExternalId: async () => ({ result: { id: 101, status: "draft", costs: { total: "200.00" } } }),
      confirmOrder: async () => { called = true; },
    };
    await assert.rejects(fulfillOrder(costly, services(paidSession(costly), pf)));
    assert.equal(called, false); assert.equal((await row(costly)).status, "needs_attention");
  } finally { if (previous === undefined) delete process.env.REPLIT_DEPLOYMENT; else process.env.REPLIT_DEPLOYMENT = previous; }
});

test("payment webhook rejects forgery, accepts verified events and requests retries on failure", async () => {
  const id = await fixture(); let fulfilled = 0;
  const signingFixture = "fixture-signing-value-not-a-real-secret";
  const app = express();
  registerPaymentWebhooks(app, {
    getSync: async () => ({ postgresClient: { query: async () => ({ rows: [{ secret: signingFixture, url: "https://example.test/api/shop/payment-events/fixture" }] }) } }),
    getStripe: async () => stripeUtil,
    fulfill: async () => { fulfilled++; throw new Error("Temporarily unavailable"); },
  });
  app.use(express.json());
  const server = app.listen(0); await new Promise<void>(resolve => server.once("listening", resolve));
  const endpoint = `http://127.0.0.1:${(server.address() as any).port}/api/shop/payment-events/fixture`;
  const payload = JSON.stringify({ id: "evt_fixture", type: "checkout.session.completed", data: { object: paidSession(id) } });
  const signature = stripeUtil.webhooks.generateTestHeaderString({ payload, secret: signingFixture });
  try {
    assert.equal((await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "forged" }, body: payload })).status, 400);
    assert.equal(fulfilled, 0);
    assert.equal((await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": signature }, body: payload })).status, 503);
    assert.equal(fulfilled, 1);
    const tampered = payload.replace("evt_fixture", "evt_tampered");
    assert.equal((await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": signature }, body: tampered })).status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
