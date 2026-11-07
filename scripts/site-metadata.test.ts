import { strict as assert } from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { getPageMetadata, injectPageMetadata, renderPageMetadata, SITE_ORIGIN } from "../client/src/lib/site-metadata";
import { serveStatic } from "../server/vite";

const routes = ["/", "/about", "/projects", "/publications", "/studio", "/contact"];

test("public pages have distinct, authored search metadata and complete social previews", () => {
  assert.equal(new Set(routes.map((route) => getPageMetadata(route).title)).size, routes.length);
  assert.equal(new Set(routes.map((route) => getPageMetadata(route).description)).size, routes.length);
  for (const route of routes) {
    const page = getPageMetadata(route);
    const head = renderPageMetadata(route);
    assert.equal(page.noindex, false);
    assert.equal(page.canonical, `${SITE_ORIGIN}${route}`);
    for (const property of ["og:title", "og:description", "og:url", "og:type", "og:site_name", "og:image"]) {
      assert.ok(head.includes(`property="${property}"`));
    }
    assert.ok(head.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(head.includes('name="twitter:image"'));
    assert.ok(head.includes('content="https://ethanfryer.com/social-preview.png"'));
  }
});

test("canonical URLs omit transient parameters and escape untrusted paths", () => {
  assert.equal(getPageMetadata("/publications?doc=example#page=2").canonical, `${SITE_ORIGIN}/publications?doc=example`);
  assert.equal(getPageMetadata("/about/").canonical, `${SITE_ORIGIN}/about`);
  assert.equal(getPageMetadata("/index.html").canonical, `${SITE_ORIGIN}/`);
  assert.equal(getPageMetadata("/studio/123?checkout=cancelled").title, getPageMetadata("/studio").title);
  assert.ok(!renderPageMetadata('/"><script>alert(1)</script>').includes("<script>"));
  assert.ok(getPageMetadata("/missing").noindex);
});

test("shell replacement retains one metadata set and safe shell defaults", () => {
  const shell = fs.readFileSync("client/index.html", "utf8");
  for (const route of routes) {
    const html = injectPageMetadata(shell, route);
    assert.equal((html.match(/<title\b/g) ?? []).length, 1);
    assert.equal((html.match(/name="description"/g) ?? []).length, 1);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
    assert.ok(html.includes(renderPageMetadata(route)));
    assert.ok(html.includes('href="/favicon.svg"'));
  }
  assert.ok(shell.includes("Architectural Portfolio"));
});

test("production HTML and identity assets are served from the build", async () => {
  const app = express();
  serveStatic(app, path.resolve("dist/public"), { publications: async () => [], products: async () => [] });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    for (const route of [...routes, "/about?tracking=ignored"]) {
      const response = await fetch(`${origin}${route}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type")!, /text\/html/);
      assert.ok((await response.text()).includes(renderPageMetadata(route)), route);
    }
    assert.equal((await fetch(`${origin}/index.html`, { redirect: "manual" })).status, 301);
    assert.equal((await fetch(`${origin}/studio/123`)).status, 404);
    for (const [asset, type] of [
      ["/favicon.svg", /image\/svg\+xml/],
      ["/favicon.ico", /image\/.*icon/],
      ["/social-preview.png", /image\/png/],
    ] as const) {
      const response = await fetch(`${origin}${asset}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type")!, type);
      assert.ok((await response.arrayBuffer()).byteLength > 100);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
