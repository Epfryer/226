import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import express from "express";
import { shopPool } from "../server/shop-store";
import { registerShopRoutes } from "../server/shop-routes";
import { renderPublicResponse } from "../server/public-render";

after(async () => { await shopPool.end(); });

test("private status links expose only a paid order and refresh real tracking without changing orders", async (t) => {
  const client = await shopPool.connect();
  const token = "a".repeat(64);
  const hash = createHash("sha256").update(token).digest("hex");
  let state = "pending";
  let calls = 0;
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE shop_orders (
      id text PRIMARY KEY, status text, paid boolean, test_mode boolean,
      tracking jsonb, printful_order_id text, recipient jsonb
    ) ON COMMIT DROP`);
    await client.query("CREATE TEMP TABLE shop_receipts (order_id text PRIMARY KEY, status_token_hash text UNIQUE) ON COMMIT DROP");
    await client.query(`INSERT INTO shop_orders VALUES ('order-1','fulfilled',true,false,NULL,'pf-1',$1)`,
      [{ email: "private@example.test", address: "private address" }]);
    await client.query("INSERT INTO shop_receipts VALUES ('order-1',$1)", [hash]);
    t.mock.method(shopPool, "query", client.query.bind(client) as typeof shopPool.query);
    const app = express(); app.use(express.json());
    registerShopRoutes(app, {
      getStripe: async () => { throw new Error("Stripe must not be used"); },
      getPrintful: () => ({
        getOrderByExternalId: async (id: string) => {
          calls++; assert.equal(id, "web-order-1");
          if (state === "offline") throw new Error("Provider unavailable");
          if (state === "shipped") return { result: { status: "fulfilled", shipments: [
            { tracking_number: "TRACK-123", tracking_url: "https://carrier.example.test/track/123", carrier: "Carrier" },
          ] } };
          if (state === "unsafe") return { result: { status: "fulfilled", shipments: [
            { tracking_number: "TRACK-123", tracking_url: "javascript:alert(1)", carrier: "Carrier" },
          ] } };
          if (state === "onhold") return { result: { status: "onhold", shipments: [] } };
          return { result: { status: "pending", shipments: [] } };
        },
      }) as any,
      runtime: { ready: true, testMode: true, message: "" },
    });
    const server = app.listen(0); await new Promise<void>(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as any).port}`;
    const request = (value: string) => fetch(`${base}/api/shop/order-status`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: value }),
    });
    try {
      assert.equal((await request("bad")).status, 404);
      assert.equal((await request("b".repeat(64))).status, 404);
      assert.equal(calls, 0);
      const pendingResponse = await request(token);
      assert.match(pendingResponse.headers.get("cache-control") || "", /no-store/);
      assert.match(pendingResponse.headers.get("referrer-policy") || "", /no-referrer/);
      const pending = await pendingResponse.json() as any;
      assert.equal(pending.status, "fulfilled");
      assert.equal(pending.tracking, undefined);
      assert.equal(pending.refreshUnavailable, false);
      assert.ok(!JSON.stringify(pending).includes("private"));
      assert.ok(!JSON.stringify(pending).includes(token));
      state = "shipped";
      const shipped = await (await request(token)).json() as any;
      assert.equal(shipped.status, "shipped");
      assert.deepEqual(shipped.tracking, { number: "TRACK-123", carrier: "Carrier", url: "https://carrier.example.test/track/123" });
      assert.equal((await client.query("SELECT status FROM shop_orders WHERE id='order-1'")).rows[0].status, "fulfilled");
      state = "unsafe";
      const unsafe = await (await request(token)).json() as any;
      assert.equal(unsafe.tracking.number, "TRACK-123");
      assert.equal(unsafe.tracking.url, undefined);
      state = "onhold";
      assert.equal((await (await request(token)).json() as any).status, "needs_attention");
      state = "offline";
      const unavailable = await (await request(token)).json() as any;
      assert.equal(unavailable.refreshUnavailable, true);
      assert.equal(unavailable.tracking, undefined);
      await client.query("UPDATE shop_orders SET paid=false WHERE id='order-1'");
      assert.equal((await request(token)).status, 404);
    } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  } finally { t.mock.restoreAll(); await client.query("ROLLBACK"); client.release(); }
});

test("order status is a private non-indexed application page", async () => {
  const template = '<html><head><!-- site-metadata:start --><!-- site-metadata:end --></head><body><div id="root"></div></body></html>';
  const result = await renderPublicResponse(template, "/order-status", {
    products: async () => { throw new Error("Unexpected catalog request"); },
    publications: async () => { throw new Error("Unexpected publication request"); },
  });
  assert.equal(result.status, 200);
  assert.match(result.html, /noindex/);
  assert.match(result.html, /Order status \| D.EF/);
});
