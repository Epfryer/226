import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { shopPool } from "../server/shop-store";
import { recordShopConsent, registerShopRoutes } from "../server/shop-routes";
import { deliverShopReceipt, renderShopReceipt, sendShopReceipt, type ShopReceipt } from "../server/shop-receipt";
import { SHOP_EMAIL_CONSENT } from "../shared/shop-email";
import { fulfillOrder } from "../server/shop-fulfillment";

after(async () => { await shopPool.end(); });

const receipt: ShopReceipt = {
  orderId: "test-order", recipient: { name: "<Shopper> Example", email: "shopper@example.test" },
  items: [{ syncVariantId: 7, variantId: 77, name: "Print <script>", color: "Black", size: "M", price: 30, quantity: 2, image: "" }],
  subtotal: 6000, shipping: 525, tax: 321, total: 6846, testMode: false,
};

test("receipt uses the inquiry sender, escapes order data, and includes the actual payment breakdown", async () => {
  const html = renderShopReceipt(receipt);
  assert.match(html, /&lt;Shopper&gt;/);
  assert.match(html, /Print &lt;script&gt;/);
  for (const amount of ["$60.00", "$5.25", "$3.21", "$68.46"]) assert.ok(html.includes(amount));
  assert.doesNotMatch(html, /<script>/);
  let request: any;
  await sendShopReceipt(receipt, "D.EF <inquiries@example.test>", async (path, options) => {
    request = { path, ...options };
    return new Response(null, { status: 200 });
  });
  assert.equal(request.path, "/emails");
  assert.equal(request.body.from, "D.EF <inquiries@example.test>");
  assert.deepEqual(request.body.to, [receipt.recipient.email]);
  assert.equal(request.body.reply_to, "Epfryer@me.com");
  assert.equal(request.headers["Idempotency-Key"], "shop-receipt/test-order");
  assert.match(renderShopReceipt({ ...receipt, testMode: true }), /No physical order was placed/);
  await assert.rejects(sendShopReceipt(receipt, "", async () => new Response()), /sender is not configured/);
  await assert.rejects(sendShopReceipt(receipt, "sender@example.test", async () => new Response(null, { status: 503 })), /503/);
});

test("consent and unsubscribe persist only explicit live opt-ins, with safe replay and re-consent", async (t) => {
  const client = await shopPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("CREATE TEMP TABLE shop_orders (id text PRIMARY KEY, marketing_consent_recorded boolean NOT NULL DEFAULT false) ON COMMIT DROP");
    await client.query(`CREATE TEMP TABLE shop_subscribers (email text PRIMARY KEY, consent_text text NOT NULL,
      consented_at timestamptz NOT NULL DEFAULT now(), unsubscribed_at timestamptz, unsubscribe_token text UNIQUE NOT NULL) ON COMMIT DROP`);
    await client.query("INSERT INTO shop_orders(id) VALUES ('one'),('two'),('three')");
    const order = { id: "one", recipient: { email: " Shopper@Example.test " }, marketing_consent_recorded: false };
    await recordShopConsent(client, order, false, true);
    await recordShopConsent(client, order, true, false);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM shop_subscribers")).rows[0].count, 0);
    await recordShopConsent(client, order, true, true);
    const first = (await client.query("SELECT * FROM shop_subscribers")).rows[0];
    assert.equal(first.email, "shopper@example.test");
    assert.equal(first.consent_text, SHOP_EMAIL_CONSENT);
    assert.equal((await client.query("SELECT marketing_consent_recorded FROM shop_orders WHERE id='one'")).rows[0].marketing_consent_recorded, true);

    const query = client.query.bind(client);
    t.mock.method(shopPool, "query", query as typeof shopPool.query);
    const app = express(); app.use(express.urlencoded({ extended: false }));
    registerShopRoutes(app);
    const server = app.listen(0); await new Promise<void>(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as any).port}`;
    try {
      const get = await fetch(`${base}/api/shop/unsubscribe?token=${first.unsubscribe_token}`);
      assert.equal(get.status, 200);
      assert.equal((await fetch(`${base}/api/shop/subscribers.csv`)).status, 401);
      assert.equal((await client.query("SELECT unsubscribed_at FROM shop_subscribers")).rows[0].unsubscribed_at, null);
      const post = await fetch(`${base}/api/shop/unsubscribe`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: first.unsubscribe_token }),
      });

      assert.equal(post.status, 200);
      assert.ok((await client.query("SELECT unsubscribed_at FROM shop_subscribers")).rows[0].unsubscribed_at);
      await recordShopConsent(client, { ...order, marketing_consent_recorded: true }, true, true);
      assert.ok((await client.query("SELECT unsubscribed_at FROM shop_subscribers")).rows[0].unsubscribed_at);
      await recordShopConsent(client, { ...order, id: "two" }, false, true);
      assert.ok((await client.query("SELECT unsubscribed_at FROM shop_subscribers")).rows[0].unsubscribed_at);
      await recordShopConsent(client, { ...order, id: "three" }, true, true);
      const renewed = (await client.query("SELECT * FROM shop_subscribers")).rows[0];
      assert.equal(renewed.unsubscribed_at, null);
      assert.notEqual(renewed.unsubscribe_token, first.unsubscribe_token);
      await fetch(`${base}/api/shop/unsubscribe`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: first.unsubscribe_token }) });
      assert.equal((await client.query("SELECT unsubscribed_at FROM shop_subscribers")).rows[0].unsubscribed_at, null);
    } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  } finally { t.mock.restoreAll(); await client.query("ROLLBACK"); client.release(); }
});

test("receipt delivery retries failures, never resends success, and flags old uncertain attempts", async (t) => {
  const client = await shopPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE shop_receipts (order_id text PRIMARY KEY, data jsonb NOT NULL,
      status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
      next_attempt_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz) ON COMMIT DROP`);
    await client.query("INSERT INTO shop_receipts(order_id,data) VALUES ($1,$2)", [receipt.orderId, receipt]);
    t.mock.method(shopPool, "connect", (async () => ({ query: client.query.bind(client), release() {} })) as typeof shopPool.connect);
    let attempts = 0;
    const send = async () => { attempts++; if (attempts === 1) throw new Error("provider unavailable"); };
    await deliverShopReceipt(receipt.orderId, send);
    let row = (await client.query("SELECT * FROM shop_receipts")).rows[0];
    assert.equal(row.status, "pending"); assert.equal(row.attempts, 1);
    await client.query("UPDATE shop_receipts SET next_attempt_at=now()");
    await deliverShopReceipt(receipt.orderId, send);
    await deliverShopReceipt(receipt.orderId, send);
    row = (await client.query("SELECT * FROM shop_receipts")).rows[0];
    assert.equal(row.status, "sent"); assert.equal(row.attempts, 2); assert.equal(attempts, 2);
    await client.query("UPDATE shop_receipts SET status='pending', created_at=now()-interval '24 hours', next_attempt_at=now()");
    await deliverShopReceipt(receipt.orderId, send);
    assert.equal((await client.query("SELECT status FROM shop_receipts")).rows[0].status, "needs_attention");
    assert.equal(attempts, 2);
  } finally { t.mock.restoreAll(); await client.query("ROLLBACK"); client.release(); }
});

test("verified payments enqueue one receipt independently of fulfillment failures", async (t) => {
  const client = await shopPool.connect();
  const oldDeployment = process.env.REPLIT_DEPLOYMENT;
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE shop_orders (
      id text PRIMARY KEY, stripe_session_id text, status text, subtotal integer, shipping_amount integer,
      expected_amount integer, paid boolean DEFAULT false, test_mode boolean DEFAULT true,
      updated_at timestamp DEFAULT now(), recipient jsonb, items jsonb, attempts integer DEFAULT 0,
      error_code text, next_attempt_at timestamp DEFAULT now()
    ) ON COMMIT DROP`);
    await client.query(`CREATE TEMP TABLE shop_receipts (order_id text PRIMARY KEY, data jsonb NOT NULL, status text NOT NULL DEFAULT 'pending') ON COMMIT DROP`);
    const insert = async (id: string) => client.query(`INSERT INTO shop_orders
      (id,stripe_session_id,status,subtotal,shipping_amount,expected_amount,recipient,items)
      VALUES ($1,'cs_test_fixture','awaiting_payment',6000,525,6525,$2,$3)`, [id, receipt.recipient, JSON.stringify(receipt.items)]);
    await insert("live"); await insert("test"); await insert("unpaid"); await insert("missing-tax");
    t.mock.method(shopPool, "connect", (async () => ({ query: client.query.bind(client), release() {} })) as typeof shopPool.connect);
    const session = (id: string, live: boolean, paid = true) => ({
      metadata: { shop_order_id: id }, client_reference_id: id, currency: "usd",
      payment_status: paid ? "paid" : "unpaid", status: "complete", livemode: live,
      amount_subtotal: 6000, amount_total: 6846, total_details: { amount_shipping: 525, amount_tax: 321 },
      payment_intent: { latest_charge: { refunded: false, amount_refunded: 0 } },
    });
    const services = (id: string, live: boolean, paid = true) => ({
      getStripe: async () => ({ checkout: { sessions: { retrieve: async () => session(id, live, paid) } } }) as any,
      getPrintful: () => ({ getOrderByExternalId: async () => { throw new Error("offline"); } }) as any,
    });
    process.env.REPLIT_DEPLOYMENT = "1";
    await assert.rejects(fulfillOrder("live", services("live", true)), /Fulfillment needs attention/);
    assert.equal((await client.query("SELECT status FROM shop_orders WHERE id='live'")).rows[0].status, "needs_attention");
    const live = (await client.query("SELECT data FROM shop_receipts WHERE order_id='live'")).rows[0].data;
    assert.equal(live.total, 6846); assert.equal(live.tax, 321); assert.equal(live.testMode, false);
    await assert.rejects(fulfillOrder("live", services("live", true)), /Fulfillment needs attention/);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM shop_receipts WHERE order_id='live'")).rows[0].count, 1);
    await fulfillOrder("test", services("test", false));
    assert.equal((await client.query("SELECT status FROM shop_orders WHERE id='test'")).rows[0].status, "test_paid");
    assert.equal((await client.query("SELECT data FROM shop_receipts WHERE order_id='test'")).rows[0].data.testMode, true);
    await fulfillOrder("unpaid", services("unpaid", true, false));
    assert.equal((await client.query("SELECT count(*)::int AS count FROM shop_receipts WHERE order_id='unpaid'")).rows[0].count, 0);
    const incomplete = session("missing-tax", false);
    delete (incomplete.total_details as { amount_tax?: number }).amount_tax;
    await fulfillOrder("missing-tax", {
      getStripe: async () => ({ checkout: { sessions: { retrieve: async () => incomplete } } }) as any,
      getPrintful: services("missing-tax", false).getPrintful,
    });
    assert.equal((await client.query("SELECT status FROM shop_receipts WHERE order_id='missing-tax'")).rows[0].status, "needs_attention");
    assert.equal((await client.query("SELECT status FROM shop_orders WHERE id='missing-tax'")).rows[0].status, "test_paid");
  } finally {
    if (oldDeployment === undefined) delete process.env.REPLIT_DEPLOYMENT; else process.env.REPLIT_DEPLOYMENT = oldDeployment;
    t.mock.restoreAll(); await client.query("ROLLBACK"); client.release();
  }
});
