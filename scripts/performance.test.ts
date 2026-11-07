import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { serveStatic } from "../server/vite";
import { deliveryImage, responsiveImageProps } from "../client/src/lib/responsive-images";

test("responsive delivery preserves originals and leaves unknown or transformed providers alone", () => {
  const source = "https://res.cloudinary.com/studio/image/upload/v123/architecture.jpg";
  assert.equal(deliveryImage(source, 640), "https://res.cloudinary.com/studio/image/upload/f_auto,q_auto,c_limit,w_640/v123/architecture.jpg");
  const props = responsiveImageProps(source, "50vw");
  assert.equal(props.sizes, "50vw");
  for (const width of [320, 640, 960, 1280]) assert.ok(props.srcSet?.includes(`${deliveryImage(source, width)} ${width}w`));
  for (const other of ["/art.jpg", "https://example.com/art.jpg", "https://res.cloudinary.com/studio/image/upload/c_crop/v123/art.jpg"]) {
    assert.deepEqual(responsiveImageProps(other, "50vw"), { src: other });
  }
});

test("production compresses text, caches fingerprinted assets, and preserves byte ranges and HTML freshness", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "performance-"));
  fs.mkdirSync(path.join(directory, "assets"));
  fs.writeFileSync(path.join(directory, "index.html"), fs.readFileSync("client/index.html"));
  const js = "// an intentionally repetitive public asset\n".repeat(1000);
  fs.writeFileSync(path.join(directory, "assets/app-a1b2c3.js"), js);
  const app = express();
  serveStatic(app, directory);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No audit server");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const asset = await fetch(`${origin}/assets/app-a1b2c3.js`, { headers: { "Accept-Encoding": "gzip" } });
    assert.equal(asset.headers.get("content-encoding"), "gzip");
    assert.match(asset.headers.get("vary") || "", /Accept-Encoding/i);
    assert.match(asset.headers.get("cache-control") || "", /max-age=31536000.*immutable/);
    assert.equal(await asset.text(), js);
    const partial = await fetch(`${origin}/assets/app-a1b2c3.js`, { headers: { Range: "bytes=0-19", "Accept-Encoding": "gzip" } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get("content-encoding"), null);
    assert.equal(await partial.text(), js.slice(0, 20));
    const document = await fetch(origin, { headers: { "Accept-Encoding": "gzip" } });
    assert.equal(document.headers.get("content-encoding"), "gzip");
    assert.doesNotMatch(document.headers.get("cache-control") || "", /immutable/);
    assert.match(await document.text(), /<h1>/);
    const missing = await fetch(`${origin}/assets/missing.js`);
    assert.equal(missing.status, 404);
    assert.doesNotMatch(missing.headers.get("cache-control") || "", /immutable/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
