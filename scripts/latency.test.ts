import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import { AsyncCache } from "../server/async-cache";
import { loadCatalog, loadProduct } from "../server/catalog";
import { boundedMap } from "../server/bounded-map";
import { validateCart } from "../server/cart-validation";
import { registerShopRoutes, stripePrice } from "../server/shop-routes";
import { createPdfRouter } from "../server/pdf-routes";
import { createShopInitializer } from "../server/shop-runtime";
import { runShopBackfill } from "../server/shop-backfill";
import { shopPool } from "../server/shop-store";

after(async () => { await shopPool.end(); });

const delay = (ms = 5) => new Promise(resolve => setTimeout(resolve, ms));
function tracked<T>(work: (item: number) => Promise<T>) {
  let active = 0, max = 0, calls = 0;
  return {
    run: async (id: number) => {
      calls++; max = Math.max(max, ++active);
      try { return await work(id); } finally { active--; }
    },
    stats: () => ({ active, max, calls }),
  };
}
const variant = (id: number) => ({ result: { sync_variant: {
  id, variant_id: id + 100, synced: true, currency: "USD", availability_status: "active",
  retail_price: "20", name: `Print ${id}`,
} } });
const initializerConfig = { printfulConfigured: true, databaseUrl: "fixture-only", deployment: false, domain: "example.test", receiptSenderConfigured: true };

test("bounded cache coalesces refreshes, expires, bounds keys, and retries errors", async () => {
  let now = 0, calls = 0;
  const cache = new AsyncCache<string, number>(60, 2, () => now);
  const load = async () => { calls++; await delay(); return calls; };
  assert.deepEqual(await Promise.all(Array.from({ length: 20 }, () => cache.get("a", load))), Array(20).fill(1));
  await cache.get("a", load); assert.equal(calls, 1);
  now = 61;
  await Promise.all([cache.get("a", load), cache.get("a", load)]);
  assert.equal(calls, 2);
  await cache.get("b", load); await cache.get("c", load); await cache.get("a", load);
  assert.equal(calls, 5);
  await assert.rejects(cache.get("bad", async () => { throw new Error("provider failure"); }));
  assert.equal(await cache.get("bad", async () => 99), 99);
  const tiny = new AsyncCache<string, number>(60, 1);
  const pending = tiny.get("a", load);
  await assert.rejects(tiny.get("b", load), /busy/);
  await pending;
});

test("document catalog and public API share full envelopes and detail requests coalesce", async () => {
  let lists = 0, details = 0;
  const envelope = { code: 200, result: [{ id: 7, name: "Print" }], paging: { total: 1 } };
  const provider = {
    getProducts: async () => { lists++; await delay(); return envelope; },
    getProduct: async (id: number) => {
      details++; await delay(); return { code: 200, result: { sync_product: { id }, sync_variants: [] } };
    },
    getCatalogProduct: async () => ({ result: { variants: [
      { id: 77, color_code: "#aabbcc", color_code2: "#112233" },
      { id: 78, color_code: "not-a-color" },
    ] } }),
  };
  const app = express();
  registerShopRoutes(app, { getPrintful: () => provider as any, getStripe: async () => ({} as any), runtime: { ready: false, message: "init", testMode: true } });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const [, ...responses] = await Promise.all([
      loadCatalog(provider as any),
      ...Array.from({ length: 10 }, () => fetch(`${base}/api/shop/products`)),
    ]);
    for (const response of responses as Response[]) {
      assert.deepEqual(await response.json(), envelope);
      assert.equal(response.headers.get("Cache-Control"), "public, max-age=30");
      assert.equal(response.headers.get("Set-Cookie"), null);
    }
    await Promise.all(Array.from({ length: 20 }, () => fetch(`${base}/api/shop/products/7`)));
    assert.equal(lists, 1); assert.equal(details, 1);
    const colors = await fetch(`${base}/api/shop/catalog-colors/7`);
    assert.deepEqual(await colors.json(), { "77": { colorCode: "#aabbcc", colorCode2: "#112233" } });
    assert.equal((await fetch(`${base}/api/shop/products/not-an-id`)).headers.get("cache-control"), "no-store");
    assert.equal((await fetch(`${base}/api/shop/status`)).headers.get("cache-control"), "no-store");
    let retries = 0;
    const failed = { ...provider, getProducts: async () => { retries++; return {}; } };
    await assert.rejects(loadCatalog(failed as any));
    await assert.rejects(loadCatalog(failed as any));
    assert.equal(retries, 2);
    await loadProduct(8, provider as any); assert.equal(details, 2);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("cart validates all shapes and duplicates before I/O, then uses four ordered workers", async () => {
  const lookup = tracked(async id => { await delay(id % 4); return variant(id); });
  await assert.rejects(validateCart([{ syncVariantId: 1, quantity: 1 }, { syncVariantId: 1, quantity: 2 }], lookup.run), /Duplicate/);
  await assert.rejects(validateCart([{ syncVariantId: 1, quantity: 1 }, { syncVariantId: 2, quantity: -1 }], lookup.run));
  assert.equal(lookup.stats().calls, 0);
  const cart = Array.from({ length: 30 }, (_, i) => ({ syncVariantId: i + 1, quantity: 1 }));
  const result = await validateCart(cart, lookup.run);
  assert.deepEqual(result.map(item => item.syncVariantId), cart.map(item => item.syncVariantId));
  assert.equal(lookup.stats().max, 4);
  assert.equal(lookup.stats().calls, 30);
  await assert.rejects(validateCart(cart, async id => {
    const response = variant(id); response.result.sync_variant.availability_status = "discontinued"; return response;
  }), /unavailable/);
  await assert.rejects(validateCart([{ syncVariantId: 1, quantity: 1 }], async () => variant(2)), /unavailable/);
});

test("bounded Stripe waterfall overlaps variants but preserves creation order and idempotency", async () => {
  const events: string[] = [];
  const stripe = {
    products: {
      retrieve: async (id: string) => { events.push(`get:${id}`); await delay(); throw { code: "resource_missing" }; },
      create: async (data: any, options: any) => {
        assert.equal(options.idempotencyKey, `shop-product-${data.metadata.printful_sync_variant_id}`);
        events.push(`product:${data.id}`); await delay(); return data;
      },
    },
    prices: {
      list: async (data: any) => { events.push(`list:${data.lookup_keys[0]}`); await delay(); return { data: [] }; },
      create: async (data: any, options: any) => {
        assert.equal(options.idempotencyKey, data.lookup_key);
        events.push(`price:${data.product}`); await delay(); return { id: `price_${data.product}` };
      },
    },
  };
  const work = tracked(async id => stripePrice(stripe as any, {
    syncVariantId: id, variantId: id + 100, price: 20, quantity: 1, name: "Print", image: "", color: "", size: "",
  }));
  await boundedMap([1], work.run);
  assert.equal(work.stats().max, 1);
  events.length = 0;
  const results = await boundedMap(Array.from({ length: 30 }, (_, i) => i + 1), work.run);
  assert.equal(work.stats().max, 4);
  assert.equal(results.length, 30);
  assert.ok(events.indexOf("get:pf_variant_4") < events.indexOf("product:pf_variant_1"));
  for (let id = 1; id <= 30; id++) {
    const product = `pf_variant_${id}`;
    assert.ok(events.indexOf(`get:${product}`) < events.indexOf(`product:${product}`));
    assert.ok(events.indexOf(`product:${product}`) < events.indexOf(`list:${product}_usd_2000`));
    assert.ok(events.indexOf(`list:${product}_usd_2000`) < events.indexOf(`price:${product}`));
    assert.equal(results[id - 1], `price_${product}`);
  }
});

test("failed workers stop new work and drain in-flight work before rejecting", async () => {
  const lookup = tracked(async id => { await delay(); if (id === 0) throw new Error("unavailable"); return id; });
  await assert.rejects(boundedMap(Array.from({ length: 30 }, (_, i) => i), lookup.run), /unavailable/);
  assert.equal(lookup.stats().active, 0);
  assert.equal(lookup.stats().calls, 4);
});

test("cold/warm 64 KiB PDF requests read only requested bytes from a 91 MiB object", async () => {
  const size = 91 * 1024 * 1024;
  let bytes = 0, metadataCalls = 0, streams = 0, cancelled = false;
  const cache = new AsyncCache<string, { size: number; generation: string }>();
  const files = {
    metadata: (name: string) => cache.get(name, async () => {
      metadataCalls++;
      if (name === "missing.pdf") throw { code: 404 };
      return { size, generation: "123" };
    }),
    stream: (_name: string, object: any, range?: { start: number; end: number }) => {
      streams++; assert.equal(object.generation, "123");
      if (!range) {
        return new Readable({
          read() { this.push(Buffer.alloc(1024)); },
          destroy(error, callback) { cancelled = true; callback(error); },
        });
      }
      const length = range.end - range.start + 1;
      bytes += length;
      return Readable.from([Buffer.alloc(length, 7)]);
    },
  };
  const app = express(); app.use("/api/publications", createPdfRouter(files, async () => 1));
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api/publications`;
  try {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/large.pdf`, { headers: { Range: "bytes=0-65535" } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get("Content-Range"), `bytes 0-65535/${size}`);
      assert.equal((await response.arrayBuffer()).byteLength, 65536);
    }
    assert.equal(metadataCalls, 1); assert.equal(bytes, 2 * 65536);
    const suffix = await fetch(`${base}/large.pdf`, { headers: { Range: "bytes=-10" } });
    assert.equal(suffix.status, 206); assert.equal((await suffix.arrayBuffer()).byteLength, 10);
    const before = streams;
    assert.equal((await fetch(`${base}/large.pdf`, { headers: { Range: `bytes=${size}-` } })).status, 416);
    assert.equal((await fetch(`${base}/large.pdf`, { method: "HEAD" })).status, 200);
    assert.equal(streams, before);
    assert.equal((await fetch(`${base}/missing.pdf`)).status, 404);
    const abort = new AbortController();
    const full = await fetch(`${base}/large.pdf`, { signal: abort.signal, headers: { Range: "bytes=0-10", "If-Range": '"old"' } });
    assert.equal(full.status, 200);
    abort.abort();
    for (let i = 0; i < 20 && !cancelled; i++) await delay();
    assert.equal(cancelled, true);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("checkout readiness awaits safety prerequisites but never historical synchronization", async () => {
  // No real provider calls. Existing application environment is not changed.
  const events: string[] = [];
  const runtime = { ready: false, testMode: true, message: "" };
  const initialize = createShopInitializer({
    pool: { query: async () => { events.push("schema"); } } as any,
    migrate: async () => { events.push("migrate"); },
    getSync: async () => ({
      findOrCreateManagedWebhook: async () => { assert.equal(runtime.ready, false); events.push("webhook"); },
      syncBackfill: async () => { throw new Error("Backfill must not block readiness"); },
    }),
    getStripe: async () => ({
      balance: { retrieve: async () => ({ livemode: false }) },
      tax: { settings: { retrieve: async () => { events.push("tax"); return { status: "active" }; } } },
    }) as any,
    getPrintful: () => ({} as any),
  }, runtime, initializerConfig);
  await initialize();
  assert.equal(runtime.ready, true);
  assert.deepEqual(events, ["schema", "migrate", "webhook", "webhook", "tax"]);
  const failed = { ready: false, testMode: true, message: "" };
  const unsafe = createShopInitializer({
    pool: { query: async () => {} } as any, migrate: async () => {},
    getSync: async () => ({ findOrCreateManagedWebhook: async () => { throw new Error("Unavailable"); } }),
    getStripe: async () => ({ balance: { retrieve: async () => ({ livemode: false }) } }) as any,
    getPrintful: () => ({} as any),
  }, failed, initializerConfig);
  await unsafe(); assert.equal(failed.ready, false);
});

test("essential readiness still rejects inactive tax and live checkout in development", async () => {
  for (const live of [false, true]) {
    let taxChecked = false;
    const runtime = { ready: false, testMode: true, message: "" };
    const initialize = createShopInitializer({
      pool: { query: async () => {} } as any, migrate: async () => {},
      getSync: async () => ({ findOrCreateManagedWebhook: async () => {} }),
      getStripe: async () => ({
        balance: { retrieve: async () => ({ livemode: live }) },
        tax: { settings: { retrieve: async () => { taxChecked = true; return { status: "inactive" }; } } },
      }) as any,
      getPrintful: () => ({} as any),
    }, runtime, initializerConfig);
    await initialize();
    assert.equal(runtime.ready, false);
    assert.equal(taxChecked, !live);
    assert.match(runtime.message, live ? /test connection/ : /Stripe Tax/);
  }
});

test("checkout stays closed when the receipt sender is missing", async () => {
  const runtime = { ready: false, testMode: true, message: "" };
  const initialize = createShopInitializer({
    pool: { query: async () => {} } as any, migrate: async () => { throw new Error("Should not initialize"); },
    getSync: async () => { throw new Error("Should not connect"); },
    getStripe: async () => { throw new Error("Should not connect"); },
    getPrintful: () => ({} as any),
  }, runtime, { ...initializerConfig, receiptSenderConfigured: false });
  await initialize();
  assert.equal(runtime.ready, false);
  assert.match(runtime.message, /receipt sender must be configured as support@ethanfryer.com/i);
});

test("mobile PDF variants preserve selection, fallback only on 404, and surface storage outages", async () => {
  const previous = process.env.ENABLE_MOBILE_PDF_VARIANT;
  process.env.ENABLE_MOBILE_PDF_VARIANT = "true";
  const names: string[] = [];
  const app = express();
  app.use(createPdfRouter({
    metadata: async name => {
      if (name === "fallback_mobile_flat.pdf") throw { code: 404 };
      if (name.startsWith("outage")) throw { code: 503 };
      return { size: 10, generation: "1" };
    },
    stream: (name, _metadata, range) => {
      names.push(name);
      return Readable.from([Buffer.alloc(range ? range.end - range.start + 1 : 10)]);
    },
  }));
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const selected = await fetch(`${base}/book.pdf?mobile=1`, { headers: { Range: "bytes=0-1" } });
    assert.equal(selected.status, 206);
    assert.match(selected.headers.get("Vary") || "", /User-Agent/);
    await selected.arrayBuffer();
    const fallback = await fetch(`${base}/fallback.pdf`, { headers: { "User-Agent": "iPhone" } });
    assert.equal(fallback.status, 200); await fallback.arrayBuffer();
    assert.deepEqual(names, ["book_mobile_flat.pdf", "fallback.pdf"]);
    assert.equal((await fetch(`${base}/outage.pdf?mobile=1`)).status, 503);
    assert.equal(names.length, 2);
  } finally {
    if (previous === undefined) delete process.env.ENABLE_MOBILE_PDF_VARIANT;
    else process.env.ENABLE_MOBILE_PDF_VARIANT = previous;
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("multi-item quote and checkout keep live price checks with bounded provider waterfalls", async () => {
  const recipient = { name: "Test Shopper", email: "shopper@example.test", address1: "123 Test Street", city: "Los Angeles", state_code: "CA", country_code: "US", zip: "90001" };
  let changed = false, sessions = 0;
  const lookup = tracked(async id => {
    await delay();
    const value = variant(id);
    if (changed) value.result.sync_variant.retail_price = "21";
    return value;
  });
  const price = tracked(async id => { await delay(); return { data: [{ id: `price_${id}` }] }; });
  const pf = {
    getSyncVariant: lookup.run,
    calculateShipping: async () => ({ result: [{ id: "STANDARD", name: "Standard", rate: "5", currency: "USD" }] }),
    estimateOrder: async () => ({ result: { costs: { total: "100" } } }),
  };
  const stripe = {
    customers: { create: async () => ({ id: "cus_fixture" }) },
    products: { retrieve: async (id: string) => { await delay(); return { id }; } },
    prices: { list: async (data: any) => price.run(Number(data.lookup_keys[0].split("_")[2])) },
    checkout: { sessions: { create: async (data: any) => {
      sessions++;
      assert.equal(data.line_items.length, 12);
      for (let id = 1; id <= 12; id++) assert.equal(data.line_items[id - 1].price, `price_${id}`);
      return { id: "cs_test_latencyFixture", url: "https://checkout.stripe.com/test", livemode: false };
    } } },
  };
  const app = express(); app.use(express.json());
  registerShopRoutes(app, { getPrintful: () => pf as any, getStripe: async () => stripe as any, runtime: { ready: true, testMode: true, message: "test" } });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api/shop`;
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  assert.ok(domain, "Shop integration test requires an allowed application domain");
  const headers = { "Content-Type": "application/json", Origin: `https://${domain}` };
  let quoteId: string | undefined;
  try {
    const quote = await fetch(`${base}/quote`, { method: "POST", headers, body: JSON.stringify({
      recipient, items: Array.from({ length: 12 }, (_, i) => ({ syncVariantId: i + 1, quantity: 1, price: 0.01 })),
    }) });
    assert.equal(quote.status, 200);
    const data = await quote.json() as any; quoteId = data.quoteId;
    assert.equal(data.subtotal, 240);
    const cookie = quote.headers.get("set-cookie")!.split(";")[0];
    const checkout = () => fetch(`${base}/checkout`, { method: "POST", headers: { ...headers, Cookie: cookie },
      body: JSON.stringify({ quoteId, shippingId: "STANDARD" }) });
    // A live price change must still stop payment despite all browsing caches.
    changed = true;
    assert.equal((await checkout()).status, 409); assert.equal(sessions, 0);
    changed = false;
    assert.equal((await checkout()).status, 200); assert.equal(sessions, 1);
    assert.equal(lookup.stats().max, 4); assert.equal(lookup.stats().calls, 36);
    assert.equal(price.stats().max, 4); assert.equal(price.stats().calls, 12);
  } finally {
    if (quoteId) await shopPool.query("DELETE FROM shop_orders WHERE id=$1", [quoteId]);
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("historical synchronization checkpoints survive restart and coordinate concurrent workers", async () => {
  const completed = new Set<string>(), calls: string[] = [];
  let locked = false, fail = true;
  const deps = {
    pool: { connect: async () => {
      const client = new EventEmitter() as any;
      client.release = () => {};
      client.query = async (sql: string, params: any[]) => {
        if (sql.includes("pg_try_advisory_lock")) {
          if (locked) return { rows: [{ locked: false }] };
          locked = true; return { rows: [{ locked: true }] };
        }
        if (sql.includes("pg_advisory_unlock")) { locked = false; return { rows: [] }; }
        if (sql.startsWith("SELECT object_type")) return { rows: Array.from(completed, object_type => ({ object_type })) };
        if (sql.includes("INSERT")) { completed.add(params[1]); return { rows: [] }; }
        throw new Error("Unexpected query");
      };
      return client;
    } } as any,
    getStripe: async () => ({
      accounts: { retrieve: async () => ({ id: "acct_fixture" }) },
      balance: { retrieve: async () => ({ livemode: false }) },
    }) as any,
    getSync: async () => ({ syncBackfill: async ({ object }: any) => {
      calls.push(object); await delay();
      if (fail && object === "price") throw new Error("Interrupted");
    } }),
  };
  await assert.rejects(runShopBackfill(deps), /Interrupted/);
  assert.ok(completed.has("product")); assert.ok(!completed.has("price"));
  fail = false;
  await Promise.all([runShopBackfill(deps), runShopBackfill(deps)]);
  assert.equal(calls.filter(type => type === "product").length, 1);
  assert.equal(calls.filter(type => type === "price").length, 2);
  assert.equal(completed.size, 17); assert.equal(locked, false);
  const before = calls.length;
  await runShopBackfill(deps); assert.equal(calls.length, before);
});
