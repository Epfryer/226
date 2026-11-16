import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { shopPool } from "../server/shop-store";
import { recordShopConsent, registerShopRoutes } from "../server/shop-routes";
import { deliverShopReceipt, renderShopReceipt, sendShopReceipt, type ShopReceipt } from "../server/shop-receipt";
import { SHOP_EMAIL_CONSENT } from "../shared/shop-email";
import { fulfillOrder } from "../server/shop-fulfillment";
import { createHash } from "node:crypto";

after(async () => { await shopPool.end(); });

const receipt: ShopReceipt = {
  templateVersion: 2,
  orderId: "test-order", recipient: { name: "<Shopper> Example", email: "shopper@example.test" },
  items: [{ syncVariantId: 7, variantId: 77, name: "Print <script>", color: "Black", size: "M", price: 30, quantity: 2, image: "" }],
  subtotal: 6000, shipping: 525, tax: 321, total: 6846, testMode: false,
  delivery: { name: "Standard <delivery>", minDeliveryDays: 3, maxDeliveryDays: 7 },
};

test("receipt uses the support sender, escapes order data, and includes the actual payment breakdown", async () => {
  const html = renderShopReceipt(receipt);
  assert.match(html, /&lt;Shopper&gt;/);
  assert.match(html, /Print &lt;script&gt;/);
  assert.match(html, /Standard &lt;delivery&gt;/);
  assert.match(html, /3–7 business days/);
  assert.match(html, /Tracking is not available yet/);
  for (const amount of ["$60.00", "$5.25", "$3.21", "$68.46"]) assert.ok(html.includes(amount));
  assert.doesNotMatch(html, /<script>/);
  let request: any;
  await sendShopReceipt(receipt, "D.EF <support@ethanfryer.com>", async (path, options) => {
    request = { path, ...options };
    return new Response(null, { status: 200 });
  });
  assert.equal(request.path, "/emails");
  assert.equal(request.body.from, "D.EF <support@ethanfryer.com>");
  assert.deepEqual(request.body.to, [receipt.recipient.email]);
  assert.equal(request.body.reply_to, "support@ethanfryer.com");
  assert.equal(request.headers["Idempotency-Key"], "shop-receipt/test-order");
  assert.match(renderShopReceipt({ ...receipt, testMode: true }), /No physical order was placed/);
  await assert.rejects(sendShopReceipt(receipt, "", async () => new Response()), /sender must be configured as support@ethanfryer.com/);
  await assert.rejects(sendShopReceipt(receipt, "inquiry@ethanfryer.com", async () => new Response()), /sender must be configured as support@ethanfryer.com/);
  await assert.rejects(sendShopReceipt(receipt, "support@ethanfryer.com", async () => new Response(null, { status: 503 })), /503/);
});

test("receipt shows known tracking safely and handles missing or partial estimates", () => {
  const tracked = renderShopReceipt({
    ...receipt, tracking: { number: "T<123>", carrier: "Carrier & Co", url: "https://tracking.example.test/path?a=1&b=2" },
  });
  assert.match(tracked, /T&lt;123&gt;/);
  assert.match(tracked, /Carrier &amp; Co/);
  assert.match(tracked, /href="https:\/\/tracking\.example\.test\/path\?a=1&amp;b=2"/);
  assert.doesNotMatch(tracked, /Tracking is not available yet/);
  const unsafe = renderShopReceipt({
    ...receipt, tracking: { number: "T123", url: "javascript:alert(1)" }, delivery: { name: "Express", minDeliveryDays: 2 },
  });
  assert.match(unsafe, /At least 2 business days/);
  assert.doesNotMatch(unsafe, /href="javascript:/);
  assert.match(renderShopReceipt({ ...receipt, delivery: { name: "Standard", maxDeliveryDays: 5 } }), /Up to 5 business days/);
  assert.match(renderShopReceipt({ ...receipt, delivery: { name: "Standard", minDeliveryDays: 1, maxDeliveryDays: 1 } }), /1 business day \(/);
  assert.match(renderShopReceipt({ ...receipt, delivery: { name: "Standard", minDeliveryDays: 8, maxDeliveryDays: 3 } }), /An estimate was not available at checkout/);
  assert.match(renderShopReceipt({ ...receipt, delivery: null }), /An estimate was not available at checkout/);
  const { templateVersion: _version, ...legacy } = receipt;
  assert.doesNotMatch(renderShopReceipt(legacy), /Delivery details/);
  const withStatus = renderShopReceipt({ ...receipt, templateVersion: 3, statusToken: "a".repeat(64), tracking: null });
  assert.match(withStatus, new RegExp(`https://ethanfryer\\.com/order-status#${"a".repeat(64)}`));
  assert.match(withStatus, /background:#000/);
  assert.match(withStatus, /background:#ededed/);
  assert.match(withStatus, /CHECK LIVE ORDER STATUS/);
  assert.match(withStatus, /refreshes tracking when you open it/);
  assert.match(withStatus, /Tracking is not available yet/);
  assert.doesNotMatch(renderShopReceipt(receipt), /VIEW ORDER STATUS/);
  assert.throws(() => renderShopReceipt({ ...receipt, templateVersion: 3 }), /status link is unavailable/);
});

test("order receipts use the shop sender independently of the inquiry sender", async () => {
  const previous = process.env.SHOP_FROM_EMAIL;
  const previousInquiry = process.env.INQUIRY_FROM_EMAIL;
  try {
    process.env.SHOP_FROM_EMAIL = "D.EF Studio <support@ethanfryer.com>";
    process.env.INQUIRY_FROM_EMAIL = "D.EF Studio <inquiry@ethanfryer.com>";
    await sendShopReceipt(receipt, undefined, async (_path, options) => {
      const email = options.body as { from: string; reply_to: string };
      assert.equal(email.from, process.env.SHOP_FROM_EMAIL);
      assert.equal(email.reply_to, "support@ethanfryer.com");
      return new Response(null, { status: 200 });
    });
    delete process.env.SHOP_FROM_EMAIL;
    await assert.rejects(sendShopReceipt(receipt, undefined, async () => new Response()), /support@ethanfryer.com/);
  } finally {
    if (previous === undefined) delete process.env.SHOP_FROM_EMAIL;
    else process.env.SHOP_FROM_EMAIL = previous;
    if (previousInquiry === undefined) delete process.env.INQUIRY_FROM_EMAIL;
    else process.env.INQUIRY_FROM_EMAIL = previousInquiry;
  }
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
    await client.query("CREATE TEMP TABLE shop_orders (id text PRIMARY KEY, tracking jsonb) ON COMMIT DROP");
    await client.query("INSERT INTO shop_orders(id,tracking) VALUES ($1,$2)", [receipt.orderId, { number: "TRACK-1", carrier: "Carrier", url: "https://tracking.example.test/1" }]);
    await client.query("INSERT INTO shop_receipts(order_id,data) VALUES ($1,$2)", [receipt.orderId, receipt]);
    t.mock.method(shopPool, "connect", (async () => ({ query: client.query.bind(client), release() {} })) as typeof shopPool.connect);
    let attempts = 0;
    const sent: ShopReceipt[] = [];
    const send = async (data: ShopReceipt) => { sent.push(data); attempts++; if (attempts === 1) throw new Error("provider unavailable"); };
    await deliverShopReceipt(receipt.orderId, send);
    let row = (await client.query("SELECT * FROM shop_receipts")).rows[0];
    assert.equal(row.status, "pending"); assert.equal(row.attempts, 1);
    assert.equal(row.data.tracking.number, "TRACK-1");
    await client.query("UPDATE shop_orders SET tracking=$2 WHERE id=$1", [receipt.orderId, { number: "TRACK-2" }]);
    await client.query("UPDATE shop_receipts SET next_attempt_at=now()");
    await deliverShopReceipt(receipt.orderId, send);
    await deliverShopReceipt(receipt.orderId, send);
    row = (await client.query("SELECT * FROM shop_receipts")).rows[0];
    assert.equal(row.status, "sent"); assert.equal(row.attempts, 2); assert.equal(attempts, 2);
    assert.deepEqual(sent[0], sent[1]);
    assert.equal(sent[1].tracking?.number, "TRACK-1");
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
      error_code text, next_attempt_at timestamp DEFAULT now(), shipping_id text, shipping_rates jsonb
    ) ON COMMIT DROP`);
    await client.query(`CREATE TEMP TABLE shop_receipts (order_id text PRIMARY KEY, data jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', status_token_hash text UNIQUE) ON COMMIT DROP`);
    const insert = async (id: string) => client.query(`INSERT INTO shop_orders
      (id,stripe_session_id,status,subtotal,shipping_amount,expected_amount,recipient,items,shipping_id,shipping_rates)
      VALUES ($1,'cs_test_fixture','awaiting_payment',6000,525,6525,$2,$3,'STANDARD',$4)`,
    [id, receipt.recipient, JSON.stringify(receipt.items), JSON.stringify([{ id: "STANDARD", ...receipt.delivery }, { id: "OTHER", name: "Other", minDeliveryDays: 1 }])]);
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
    const stored = (await client.query("SELECT data,status_token_hash FROM shop_receipts WHERE order_id='live'")).rows[0];
    const live = stored.data;
    assert.equal(live.total, 6846); assert.equal(live.tax, 321); assert.equal(live.testMode, false);
    assert.deepEqual(live.delivery, receipt.delivery);
    assert.equal(live.templateVersion, 3);
    assert.match(live.statusToken, /^[a-f0-9]{64}$/);
    assert.equal(stored.status_token_hash, createHash("sha256").update(live.statusToken).digest("hex"));
    await assert.rejects(fulfillOrder("live", services("live", true)), /Fulfillment needs attention/);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM shop_receipts WHERE order_id='live'")).rows[0].count, 1);
    assert.equal((await client.query("SELECT status_token_hash FROM shop_receipts WHERE order_id='live'")).rows[0].status_token_hash, stored.status_token_hash);
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
