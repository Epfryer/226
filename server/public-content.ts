import { Client } from "@replit/object-storage";
import { getPdfMetadata } from "./storage";
import { getPrintfulClient } from "./printful";
import { getPublicationCover } from "../client/src/data/publication-covers";
import type { Publication } from "../client/src/data/publications";
import type { PublicProduct } from "../client/src/lib/public-page-data";

// Cache successful public data briefly, coalescing requests. Failures are never
// turned into a successful empty catalog (which could remove content from search).
function cached<T>(load: () => Promise<T>) {
  let value: T | undefined;
  let expires = 0;
  let pending: Promise<T> | undefined;
  return () => {
    if (value !== undefined && Date.now() < expires) return Promise.resolve(value);
    return pending ??= load().then(result => {
      value = result;
      expires = Date.now() + 60_000;
      return result;
    }).finally(() => { pending = undefined; });
  };
}
export const loadPublications = cached(async (): Promise<Publication[]> => {
  const client = new Client({ bucketId: process.env.REPL_OBJSTORE_BUCKET_ID || "replit-objstore-a538e3dd-048a-46be-b441-abad6fd99c02" });
  const listing = await client.list();
  if (!listing.ok) throw new Error("Publication storage unavailable");
  return Promise.all(listing.value.filter(item => item.name.toLowerCase().endsWith(".pdf")).map(async item => {
    const filename = item.name;
    const metadata = await getPdfMetadata(filename);
    let cover = `/publications/${filename.replace(/\.pdf$/i, ".jpg")}`;
    if (filename.includes("Natures_Transcendence_ICR")) cover = "/publications/EthanFryer_Natures_Transcendence_ICR_Page.jpg";
    else if (/European[_ ]Travel/.test(filename)) cover = "/publications/EthanFryer_European_Travel_Research_Paper.jpg";
    return {
      slug: filename.replace(".pdf", "").replace(/[^a-zA-Z0-9-]/g, "-"),
      title: metadata.title,
      year: metadata.year,
      filename,
      pdfPath: `/api/publications/${encodeURIComponent(filename)}`,
      ...getPublicationCover(cover),
    };
  }));
});
export const loadProducts = cached(async (): Promise<PublicProduct[]> => {
  const response = await getPrintfulClient().getProducts();
  if (!Array.isArray(response.result)) throw new Error("Product catalog unavailable");
  return response.result.map((item: PublicProduct) => ({
    id: item.id, name: item.name, thumbnail_url: item.thumbnail_url,
    variants: item.variants, synced: item.synced,
  }));
});
