import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseRange, PdfFileCache } from "../server/pdf-delivery";
import { validateCart } from "../server/cart-validation";

test("PDF ranges support suffix/open bounds and reject malformed input", () => {
  assert.deepEqual(parseRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=90-999", 100), { start: 90, end: 99 });
  for (const range of ["bytes=-0", "bytes=20-10", "bytes=100-", "bytes=x-y", "bytes=0-1,3-4", "bytes=-"]) {
    assert.equal(parseRange(range, 100), null);
  }
});
test("PDF concurrent downloads coalesce and ranges stream correctly", async () => {
  let calls = 0;
  const cache = new PdfFileCache(() => { calls++; return Readable.from([Buffer.from("0123456789")]); });
  const [a, b] = await Promise.all([cache.acquire("test"), cache.acquire("test")]);
  assert.equal(calls, 1);
  let text = "";
  for await (const chunk of a.stream({ start: 3, end: 5 })) text += chunk;
  assert.equal(text, "345");
  a.release(); b.release();
});
test("PDF oversize downloads fail explicitly", async () => {
  const cache = new PdfFileCache(() => Readable.from([Buffer.alloc(20)]), 1, 10);
  await assert.rejects(cache.acquire("large"), /size/);
});
test("Cart uses authoritative prices and rejects unavailable/invalid items", async () => {
  const variant = { id: 1, variant_id: 2, synced: true, currency: "USD", availability_status: "active", retail_price: "25", name: "Print" };
  const get = async () => ({ result: { sync_variant: variant } });
  const items = await validateCart([{ syncVariantId: 1, quantity: 2, price: 0.01 }], get);
  assert.equal(items[0].price, 25);
  await assert.rejects(validateCart([{ syncVariantId: 1, quantity: -1 }], get));
  variant.availability_status = "discontinued";
  await assert.rejects(validateCart([{ syncVariantId: 1, quantity: 1 }], get), /unavailable/);
});
