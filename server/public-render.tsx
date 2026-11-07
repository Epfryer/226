import type { Express } from "express";
import { renderToString } from "react-dom/server";
import { PublicPage } from "../client/src/components/PublicPage";
import { findProject, publicRoutes, projectPath } from "../client/src/lib/public-routes";
import { projects } from "../client/src/lib/projects";
import { injectPageMetadata, SITE_ORIGIN } from "../client/src/lib/site-metadata";
import type { PublicPageData } from "../client/src/lib/public-page-data";
import { loadProducts, loadPublications } from "./public-content";

export function registerCrawlerRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /diagnostics\nDisallow: /api/shop/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
  ));
  app.get("/sitemap.xml", (_req, res) => {
    const urls = [...publicRoutes, ...projects.map(projectPath)];
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join("")}</urlset>`);
  });
}

export const publicContentServices = { publications: loadPublications, products: loadProducts };
export async function renderPublicResponse(template: string, url: string, services = publicContentServices) {
  const parsed = new URL(url, SITE_ORIGIN);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  const data: PublicPageData = { url, status: 200 };
  const valid = (publicRoutes as readonly string[]).includes(pathname) || !!findProject(pathname) || /^\/studio\/[1-9]\d*$/.test(pathname) || pathname === "/diagnostics";
  if (!valid) data.status = 404;
  try {
    if (pathname === "/publications") {
      data.publications = await services.publications();
      if (parsed.searchParams.has("doc") && !data.publications.some(pub => pub.slug === parsed.searchParams.get("doc"))) data.status = 404;
    }
    if (pathname === "/studio" || /^\/studio\/[1-9]\d*$/.test(pathname)) {
      data.products = await services.products();
      if (pathname !== "/studio" && !data.products.some(item => pathname === `/studio/${item.id}`)) data.status = 404;
    }
  } catch {
    data.status = 503;
    data.unavailable = pathname === "/publications" ? "Publications are temporarily unavailable." : "The product catalog is temporarily unavailable.";
  }
  const body = pathname === "/diagnostics" ? "" : renderToString(<PublicPage data={data} />);
  // Escaping '<' protects both HTML and script boundaries in arbitrary catalog text.
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const doc = data.publications?.find(pub => pub.slug === parsed.searchParams.get("doc"));
  const product = data.products?.find(item => pathname === `/studio/${item.id}`);
  const override = data.status === 404 ? { title: "Page Not Found | Ethan Fryer | D.EF", description: "The requested page does not exist. Browse architecture projects, publications, and D.EF Studio." }
    : doc ? { title: `${doc.title} | Ethan Fryer | D.EF`, description: `${doc.title} (${doc.year}), an architectural publication by Ethan Fryer. Read online or open the PDF.` }
    : product ? { title: `${product.name} | D.EF Studio`, description: `${product.name} by D.EF Studio. Explore product options in Ethan Fryer's collection of graphics, garments, and design objects.` }
    : undefined;
  let html = injectPageMetadata(template, url, override).replace('<div id="root"></div>', () => `<div id="root">${body}</div><script id="public-page-data" type="application/json">${json}</script>`);
  if (data.status !== 200 || pathname === "/diagnostics") html = html.replace("</head>", '<meta name="robots" content="noindex, follow" /></head>');
  return { html, status: data.status };
}
