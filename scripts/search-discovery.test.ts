import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { renderPublicResponse } from "../server/public-render";
import { serveStatic } from "../server/vite";
import { projects } from "../client/src/lib/projects";
import { findProject, projectPath, publicRoutes } from "../client/src/lib/public-routes";
import { deliveryImage } from "../client/src/lib/responsive-images";

const template = fs.readFileSync("client/index.html", "utf8");
const publication = { slug: "research", title: "Architecture Research", year: "2025", pdfPath: "/api/publications/Research.pdf", coverPath: "/publications/Research.jpg" };
const product = { id: 123, name: "Studio Tee", variants: 3, synced: 3, thumbnail_url: "https://example.com/tee.jpg" };
const services = { publications: async () => [publication], products: async () => [product] };

test("all public routes have initial headings, navigation, and authored body content", async () => {
  for (const route of publicRoutes) {
    const { html, status } = await renderPublicResponse(template, route, services);
    assert.equal(status, 200);
    assert.match(html, /<h1>/);
    assert.match(html, /<nav aria-label="Main navigation">/);
    assert.match(html, /<p>/);
    assert.match(html, /id="public-page-data"/);
    for (const target of publicRoutes) assert.ok(html.includes(`href="${target}"`));
  }
});
test("every project has a working encoded detail URL, description, image sequence, and unique metadata", async () => {
  const titles = new Set();
  for (const project of projects) {
    const href = projectPath(project);
    assert.equal(findProject(href), project);
    const { html, status } = await renderPublicResponse(template, href, services);
    assert.equal(status, 200);
    assert.match(html, /<h1>/);
    assert.ok(html.includes(deliveryImage(project.image, 640)));
    for (const image of project.images) assert.ok(html.includes(deliveryImage(image, 640)));
    assert.ok(html.includes(`<link data-site-metadata rel="canonical" href="https://ethanfryer.com${href}"`));
    titles.add(html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]);
  }
  assert.equal(titles.size, projects.length);
  assert.equal((await renderPublicResponse(template, "/project/unknown", services)).status, 404);
  assert.equal((await renderPublicResponse(template, "/project/%ZZ", services)).status, 404);
});
test("publication list exposes reader and PDF anchors; reader address serves a summary and canonical", async () => {
  const listing = await renderPublicResponse(template, "/publications", services);
  assert.ok(listing.html.includes('href="/publications?doc=research"'));
  assert.ok(listing.html.includes(`href="${publication.pdfPath}"`));
  const detail = await renderPublicResponse(template, "/publications?doc=research&tracking=ignored", services);
  assert.equal(detail.status, 200);
  assert.ok(detail.html.includes("<h1>Architecture Research</h1>"));
  assert.ok(detail.html.includes('rel="canonical" href="https://ethanfryer.com/publications?doc=research"'));
  assert.equal((await renderPublicResponse(template, "/publications?doc=unknown", services)).status, 404);
});
test("shop data is server-rendered; unknown products 404 and provider errors 503", async () => {
  const listing = await renderPublicResponse(template, "/studio", services);
  assert.ok(listing.html.includes('href="/studio/123"'));
  assert.ok(listing.html.includes("Studio Tee"));
  assert.equal((await renderPublicResponse(template, "/studio/123", services)).status, 200);
  assert.equal((await renderPublicResponse(template, "/studio/456", services)).status, 404);
  const failed = { publications: async () => { throw new Error("down"); }, products: async () => { throw new Error("down"); } };
  for (const route of ["/studio", "/publications"]) {
    const response = await renderPublicResponse(template, route, failed);
    assert.equal(response.status, 503);
    assert.match(response.html, /temporarily unavailable/);
    assert.match(response.html, /noindex, follow/);
  }
});
test("each Studio product has a descriptive crawlable link and distinct detail document", async () => {
  const products = [product, { ...product, id: 456, name: "Studio Print" }];
  const catalog = { ...services, products: async () => products };
  const listing = await renderPublicResponse(template, "/studio", catalog);
  const titles = new Set();
  for (const item of products) {
    const href = `/studio/${item.id}`;
    assert.ok(listing.html.includes(`<a href="${href}">${item.name}</a>`));
    const detail = await renderPublicResponse(template, `${href}?tracking=ignored`, catalog);
    assert.equal(detail.status, 200);
    assert.ok(detail.html.includes(`<h1>${item.name}</h1>`));
    assert.ok(detail.html.replace(/<!--.*?-->/g, "").includes(`${item.variants} product variants`));
    assert.ok(detail.html.includes(`rel="canonical" href="https://ethanfryer.com${href}"`));
    assert.ok(detail.html.includes(`<title data-site-metadata>${item.name} | D.EF Studio</title>`));
    assert.doesNotMatch(detail.html, /name="robots" content="noindex/);
    titles.add(detail.html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]);
  }
  assert.equal(titles.size, products.length);
});
test("catalog text is escaped in HTML and bootstrap JSON", async () => {
  const dangerous = "</script><script>alert(1)</script>";
  const { html } = await renderPublicResponse(template, "/studio", { ...services, products: async () => [{ ...product, name: dangerous }] });
  assert.ok(!html.includes(dangerous));
  const json = html.match(/id="public-page-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  assert.equal(JSON.parse(json!).products[0].name, dangerous);
});
test("production handles crawler files, redirects, valid routes, diagnostics, and genuine errors", async () => {
  const app = express();
  serveStatic(app, path.resolve("dist/public"), services);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    const robots = await fetch(`${origin}/robots.txt`);
    assert.match(robots.headers.get("content-type")!, /text\/plain/);
    assert.match(await robots.text(), /Sitemap: https:\/\/ethanfryer.com\/sitemap.xml/);
    const sitemap = await fetch(`${origin}/sitemap.xml`);
    assert.match(sitemap.headers.get("content-type")!, /application\/xml/);
    const xml = await sitemap.text();
    for (const route of [...publicRoutes, ...projects.map(projectPath)]) assert.ok(xml.includes(`<loc>https://ethanfryer.com${route}</loc>`));
    assert.ok(!xml.includes("diagnostics"));
    assert.ok(!xml.includes("session_id"));
    for (const route of [...publicRoutes, ...projects.map(projectPath), "/studio/123", "/publications?doc=research"]) {
      const response = await fetch(`${origin}${route}`);
      assert.equal(response.status, 200, route);
      assert.match(await response.text(), /<h1>/);
    }
    for (const route of ["/unknown", "/project/unknown", "/studio/999"]) {
      const response = await fetch(`${origin}${route}`);
      assert.equal(response.status, 404, route);
      assert.match(await response.text(), /404 — Page not found/);
    }
    for (const route of ["/api", "/api/unknown", "/assets/missing.js", "/missing.png"]) {
      const response = await fetch(`${origin}${route}`);
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.headers.get("content-type")!, /text\/html/);
    }
    const diagnostics = await fetch(`${origin}/diagnostics`);
    assert.equal(diagnostics.status, 200);
    assert.match(await diagnostics.text(), /noindex/);
    for (const [route, status] of [["/projects", 200], ["/unknown", 404], ["/robots.txt", 200], ["/sitemap.xml", 200]] as const) {
      const response = await fetch(`${origin}${route}`, { method: "HEAD" });
      assert.equal(response.status, status);
      assert.equal(await response.text(), "");
    }
    const unsupported = await fetch(`${origin}/projects`, { method: "POST" });
    assert.equal(unsupported.status, 404);
    assert.doesNotMatch(unsupported.headers.get("content-type")!, /text\/html/);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
