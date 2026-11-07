import { projects, type Project } from "../lib/projects";
import { findProject, projectPath, publicRoutes } from "../lib/public-routes";
import type { PublicPageData } from "../lib/public-page-data";
import { getPageMetadata } from "../lib/site-metadata";

function ProjectContent({ project, detail = false }: { project: Project; detail?: boolean }) {
  return <article>
    {detail ? <h1>{project.title}</h1> : <h2><a href={projectPath(project)}>{project.title}</a></h2>}
    <p>{project.year} · {project.category} · {project.location}</p>
    <img src={project.image} alt={project.imageAlt} width="640" loading="lazy" />
    <p>{project.description}</p>
    {detail && project.images.map((src, index) => <img key={src} src={src} alt={project.imageAlts[index] || `${project.title} — view ${index + 1}`} width="640" loading="lazy" />)}
  </article>;
}

/** Semantic first response, shared by server rendering and the first hydration pass. */
export function PublicPage({ data }: { data: PublicPageData }) {
  const url = new URL(data.url, "https://public.invalid");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const project = findProject(pathname);
  const doc = data.publications?.find(pub => pub.slug === url.searchParams.get("doc"));
  const product = data.products?.find(item => `/studio/${item.id}` === pathname);
  const labels = ["Home", "About", "Projects", "Publications", "Studio", "Contact"];
  return <div className="public-document">
    <header><a href="/">D.EF — Ethan Fryer</a><nav aria-label="Main navigation">
      {publicRoutes.map((href, index) => <a key={href} href={href}>{labels[index]}</a>)}
    </nav></header>
    <main>
      {data.status === 404 ? <><h1>404 — Page not found</h1><p>The requested page does not exist. <a href="/">Return home</a> or browse the navigation.</p></>
        : data.status === 503 ? <><h1>{getPageMetadata(data.url).title}</h1><p role="alert">{data.unavailable} Please try again shortly.</p></>
        : project ? <><a href="/projects">All projects</a><ProjectContent project={project} detail /></>
        : pathname === "/publications" ? <>
          <h1>{doc ? doc.title : "Publications"}</h1>
          <p>Academic work, research papers, architectural theses, and selected works by Ethan Fryer. Read a publication online or open its PDF.</p>
          {(doc ? [doc] : data.publications || []).map(pub => <article key={pub.slug}>
            <h2><a href={`/publications?doc=${encodeURIComponent(pub.slug)}`}>{pub.title}</a></h2>
            <p>{pub.year} · Architectural publication by Ethan Fryer</p>
            {pub.coverPath && <img src={pub.coverPath} alt={`${pub.title} cover`} width="320" loading="lazy" />}
            <p><a href={pub.pdfPath}>Read {pub.title} as a PDF</a></p>
          </article>)}
          {!data.publications?.length && <p>No publications available yet.</p>}
          {doc && <a href="/publications">All publications</a>}
        </> : pathname.startsWith("/studio") ? <>
          <h1>{product ? product.name : "D.EF Studio"}</h1>
          <p>Graphics, garments, and design objects by Ethan Fryer, translated from architectural ideas and speculative imagery.</p>
          {(product ? [product] : data.products || []).map(item => <article key={item.id}>
            <h2><a href={`/studio/${item.id}`}>{item.name}</a></h2>
            {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.name} width="400" loading="lazy" />}
            <p>{item.variants} product variants. Open the interactive store to choose options and check current pricing and availability.</p>
          </article>)}
          {!data.products?.length && <p>No products available yet.</p>}
          <p>JavaScript is required for secure checkout.</p>
        </> : pathname === "/about" ? <>
          <h1>About Ethan Fryer</h1>
          <p>Architect at heart, Ethan approaches design as both spatial practice and visual authorship. His work moves between architecture, speculative studies, competitions, graphics, and objects — all connected by a desire to make ideas feel lived in.</p>
          <p>This site is a living body of work that is gradually becoming a studio: projects act as proof, publications add depth, and the shop becomes a collection of artifacts translated from the same worldview.</p>
          <h2>Selected work and studies</h2>
          <p>2025: Thesis work, competition entries, and a growing studio direction focused on spatial ideas, graphics, and objects.</p>
          <p>2024: Graduate B.Arch work at Virginia Tech shaped around architecture, narrative, visual systems, and speculative form.</p>
          <p>2023: Competitions, studies, and academic projects exploring form, rendering, geometry, and architectural storytelling.</p>
          <a href="/projects">Explore the architecture archive</a>
        </> : pathname === "/contact" ? <>
          <h1>Contact Ethan Fryer</h1>
          <p>Ethan Fryer is developing a studio practice rooted in architecture, speculative thinking, graphics, and design objects. Get in touch about commissions, collaborations, studio inquiries, and press or features.</p>
          <a href="mailto:Epfryer@me.com">Email Ethan Fryer</a>
        </> : <>
          <h1>{pathname === "/projects" ? "Architecture Projects & Studies" : "Ethan Fryer — Architecture & D.EF Studio"}</h1>
          <p>Architecture, speculative studies, competitions, graphics, and objects. Explore selected projects, <a href="/publications">architectural publications</a>, and <a href="/studio">D.EF Studio</a>.</p>
          {(pathname === "/projects" ? projects : projects.filter(item => ["thesis", "Behind The Curtain", "AIA Comp"].includes(item.id))).map(item => <ProjectContent key={item.id} project={item} />)}
        </>}
    </main>
    <footer><a href="/contact">Contact D.EF — Ethan Fryer</a></footer>
  </div>;
}
