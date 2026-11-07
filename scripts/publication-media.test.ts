import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { publicationCovers } from "../client/src/data/publication-covers.generated";
import { getPublicationCover } from "../client/src/data/publication-covers";
import { fetchPublications } from "../client/src/data/publications";
import { PublicationCard } from "../client/src/components/PublicationCard";

test("every local cover has small responsive WebP assets, without upscaling", () => {
  const directory = new URL("../client/public/publications/", import.meta.url);
  assert.equal(Object.keys(publicationCovers).length, readdirSync(directory).filter((name) => name.endsWith(".jpg")).length);
  for (const [original, cover] of Object.entries(publicationCovers)) {
    assert.ok(cover.width > 0 && cover.height > 0);
    const originalSize = statSync(new URL(`../client/public${original}`, import.meta.url)).size;
    for (const variant of cover.variants) {
      const file = new URL(`../client/public${variant.path}`, import.meta.url);
      const data = readFileSync(file);
      assert.equal(data.toString("ascii", 0, 4), "RIFF");
      assert.equal(data.toString("ascii", 8, 12), "WEBP");
      assert.ok(variant.width <= cover.width);
      assert.ok(data.length < originalSize, variant.path);
      assert.ok(data.length < 350_000, variant.path);
    }
    const resolved = getPublicationCover(original);
    assert.match(resolved.coverPath, /-640\.webp$/);
    assert.equal(resolved.coverSrcSet?.split(", ").length, cover.variants.length);
    assert.ok(resolved.coverSizes?.includes("(min-width: 768px)"));
  }
});

test("API and fallback publications resolve the same optimized cover metadata", async (t) => {
  const filenames = [
    "EthanFryer_Hybrid-Urbanism.pdf",
    "EthanFryer_5thYear_SelectedWorks.pdf",
    "EthanFryer_ChicagoStudio_FinalBook.pdf",
    "EthanFryer_Natures_Transcendence_ICR.pdf",
    "EthanFryer_European Travel_Research_Paper.pdf",
    "EthanFryer_WorkSample_2024.pdf",
  ];
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    publications: filenames.map((filename) => ({
      filename, slug: filename, title: filename, year: "2025",
      pdfPath: `/api/publications/${filename}`,
    })),
  })));
  const publications = await fetchPublications();
  assert.equal(publications.length, 6);
  for (const publication of publications) {
    assert.match(publication.coverPath!, /\/covers\/.*-640\.webp$/);
    assert.ok(publication.coverSrcSet);
    assert.equal(publication.pdfPath, `/api/publications/${publication.filename}`);
  }
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 503 }));
  t.mock.method(console, "error", () => {});
  const fallback = await fetchPublications();
  for (const [index, publication] of fallback.entries()) {
    assert.equal(publication.coverPath, publications[index].coverPath);
    assert.equal(publication.coverSrcSet, publications[index].coverSrcSet);
    assert.equal(publication.coverSizes, publications[index].coverSizes);
  }
});

test("cards keep descriptive alt text and lazy loading with responsive attributes", () => {
  const pub = {
    slug: "hybrid", title: "Hybrid Urbanism", year: "2025", pdfPath: "/api/publications/book.pdf",
    ...getPublicationCover("/publications/EthanFryer_Hybrid-Urbanism.jpg"),
  };
  const html = renderToStaticMarkup(createElement(PublicationCard, { pub, onOpen() {} }));
  assert.match(html, /alt="Hybrid Urbanism"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.match(html, /srcSet="[^"]+320w[^"]+1280w"/);
  assert.match(html, /sizes="[^"]+768px/);
  assert.match(html, /width="3508" height="2480"/);
  assert.doesNotMatch(html, /\.jpg/);
  assert.match(html, /aria-label="Open Hybrid Urbanism"/);
});

test("unknown covers retain their existing URL without nonexistent variants", () => {
  assert.deepEqual(getPublicationCover("/publications/new-cover.jpg"), {
    coverPath: "/publications/new-cover.jpg",
  });
});
