// Primary public origin verified from the deployment settings.
import { findProject, projectPath } from "./public-routes";
export const SITE_ORIGIN = "https://ethanfryer.com";
export const SITE_NAME = "D.EF — Ethan Fryer";
export const PREVIEW_IMAGE = `${SITE_ORIGIN}/social-preview.png`;

const pages: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Ethan Fryer | Architectural Portfolio & D.EF Studio",
    description: "Explore Ethan Fryer's architectural portfolio: selected projects, speculative studies, publications, and D.EF Studio's graphics, garments, and design objects.",
  },
  "/about": {
    title: "About Ethan Fryer | Architecture & Design | D.EF",
    description: "Meet Ethan Fryer and explore the ideas behind D.EF: architecture, speculative studies, competitions, graphics, and objects, with a timeline of selected work.",
  },
  "/projects": {
    title: "Architecture Projects & Studies | Ethan Fryer | D.EF",
    description: "Browse Ethan Fryer's architecture project archive, including academic work, competitions, speculative proposals, and architectural studies.",
  },
  "/publications": {
    title: "Architecture Publications & Research | Ethan Fryer | D.EF",
    description: "Read Ethan Fryer's academic work, research papers, architectural theses, and selected works through interactive digital publications.",
  },
  "/studio": {
    title: "D.EF Studio | Graphics, Garments & Design Objects",
    description: "Explore D.EF Studio by Ethan Fryer: graphic studies, garments, and design objects translated from architectural ideas and speculative imagery.",
  },
};

export function getPageMetadata(url: string, override?: { title: string; description: string }) {
  // Only reader document identity is canonical; filters, page position and checkout state are not.
  let pathname = url.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (pathname === "/index.html") pathname = "/";
  const project = findProject(pathname);
  const page = override ?? (project ? {
    title: `${project.title} | Architecture | Ethan Fryer`,
    description: project.description.slice(0, 200),
  } : pages[pathname] ?? (pathname.startsWith("/studio/") ? pages["/studio"] : undefined));
  const doc = pathname === "/publications" ? new URL(url, SITE_ORIGIN).searchParams.get("doc") : null;
  return {
    ...(page ?? {
      title: "Page Not Found | Ethan Fryer | D.EF",
      description: "Explore Ethan Fryer's architectural portfolio, publications, and D.EF Studio.",
    }),
    canonical: `${SITE_ORIGIN}${project ? projectPath(project) : pathname}${doc ? `?doc=${encodeURIComponent(doc)}` : ""}`,
    type: "website",
    noindex: !page,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function renderPageMetadata(url: string, override?: { title: string; description: string }) {
  const page = getPageMetadata(url, override);
  const meta = (key: string, value: string, property = false) =>
    `<meta data-site-metadata ${property ? "property" : "name"}="${key}" content="${escapeHtml(value)}" />`;
  return [
    `<title data-site-metadata>${escapeHtml(page.title)}</title>`,
    meta("description", page.description),
    `<link data-site-metadata rel="canonical" href="${escapeHtml(page.canonical)}" />`,
    meta("og:title", page.title, true),
    meta("og:description", page.description, true),
    meta("og:url", page.canonical, true),
    meta("og:type", page.type, true),
    meta("og:site_name", SITE_NAME, true),
    meta("og:image", PREVIEW_IMAGE, true),
    meta("og:image:type", "image/png", true),
    meta("og:image:width", "1200", true),
    meta("og:image:height", "630", true),
    meta("og:image:alt", "D.EF — Ethan Fryer. Architecture, publications, and studio.", true),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", page.title),
    meta("twitter:description", page.description),
    meta("twitter:image", PREVIEW_IMAGE),
    meta("twitter:image:alt", "D.EF — Ethan Fryer. Architecture, publications, and studio."),
    ...(page.noindex ? [meta("robots", "noindex, follow")] : []),
  ].join("\n    ");
}

export function injectPageMetadata(template: string, url: string, override?: { title: string; description: string }) {
  return template.replace(
    /<!-- site-metadata:start -->[\s\S]*?<!-- site-metadata:end -->/,
    () => `<!-- site-metadata:start -->\n    ${renderPageMetadata(url, override)}\n    <!-- site-metadata:end -->`,
  );
}
