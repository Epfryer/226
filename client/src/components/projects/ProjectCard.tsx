import { useId, useLayoutEffect, useRef } from "react";
import type { Project } from "@/lib/projects";
import { responsiveImageProps } from "@/lib/responsive-images";
import { projectImageDimensions } from "@/lib/project-image-dimensions";
import { ProjectCarousel } from "./ProjectCarousel";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onExpand: (id: string, expanded: boolean) => void;
  slideIndex: number;
  onSlideChange: (index: number) => void;
}

export function ProjectCard({ project, isExpanded, onExpand, slideIndex, onSlideChange }: ProjectCardProps) {
  const coverDimensions = projectImageDimensions[project.id];
  const panelId = useId();
  const titleId = useId();
  const rowRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const anchor = useRef<{ top: number; closing: boolean } | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      row.style.setProperty("--project-viewport-left", `${-row.getBoundingClientRect().left}px`);
      row.style.setProperty("--project-viewport-width", `${document.documentElement.clientWidth}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const toggle = (expanded: boolean) => {
    if (rowRef.current) anchor.current = { top: rowRef.current.getBoundingClientRect().top, closing: !expanded };
    onExpand(project.id, expanded);
  };

  // Compensate only for a deliberate activation, never for visibility or image loads.
  useLayoutEffect(() => {
    const pending = anchor.current;
    if (!pending || !rowRef.current) return;
    anchor.current = null;
    const delta = rowRef.current.getBoundingClientRect().top - pending.top;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" as ScrollBehavior });
    if (pending.closing) previewRef.current?.focus({ preventScroll: true });
    else closeRef.current?.focus({ preventScroll: true });
  }, [isExpanded]);

  return (
    <article ref={rowRef} className="project-feed-row" data-project-id={project.id} data-expanded={isExpanded} aria-labelledby={titleId}>
      {!isExpanded && <div className="project-feed-label">
        <img className="project-feed-thumbnail" {...responsiveImageProps(project.image, "28px")} alt="" width={28} height={28} loading="lazy" />
        <h2 id={titleId} className="project-feed-title">
          <button type="button" onClick={() => toggle(!isExpanded)} aria-expanded={isExpanded} aria-controls={panelId} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${project.title}`}>
            {project.title}
          </button>
        </h2>
        {project.location && <p className="project-feed-location">{project.location.trim()}</p>}
        {project.year && <p className="project-feed-year">{project.year}</p>}
      </div>}
      {!isExpanded && (
        <div className="project-feed-media">
          <button ref={previewRef} type="button" className="project-feed-preview" style={coverDimensions ? { aspectRatio: `${coverDimensions.width} / ${coverDimensions.height}` } : undefined} onClick={() => toggle(true)} aria-expanded={isExpanded} aria-controls={panelId} aria-label={`Expand ${project.title}`}>
            <img {...responsiveImageProps(project.image, "(max-width: 767px) calc(100vw - 44px), 40vw")} width={coverDimensions?.width} height={coverDimensions?.height} alt={project.imageAlt} loading="lazy" decoding="async" />
          </button>
        </div>
      )}
      <div id={panelId} className="project-feed-details" hidden={!isExpanded} role="region" aria-labelledby={titleId}>
        {isExpanded && (
          <>
            <div className="project-feed-gallery">
              <ProjectCarousel
                compact
                initialIndex={slideIndex}
                onSlideChange={onSlideChange}
                leadingPanel={
                  <div className="project-ribbon-facts text-right">
                    <img className="project-feed-thumbnail ml-[165px]" {...responsiveImageProps(project.image, "28px")} alt="" width={28} height={28} loading="lazy" />
                    <h2 id={titleId} className="project-feed-title">
                      <button type="button" onClick={() => toggle(false)} aria-expanded="true" aria-controls={panelId} aria-label={`Collapse ${project.title}`}>
                        {project.title}
                      </button>
                    </h2>
                    {project.location && <p className="project-feed-location">{project.location.trim()}</p>}
                    {project.year && <p className="project-feed-year">{project.year}</p>}
                    <ul className="project-feed-facts">
                      {project.category && <li>{project.category}</li>}
                      {project.metadata.filter(Boolean).map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}
                    </ul>
                    <button ref={closeRef} className="project-feed-close" type="button" aria-label={`Close ${project.title}`} aria-controls={panelId} onClick={() => toggle(false)}>
                      Close <span aria-hidden="true">×</span>
                    </button>
                  </div>
                }
                descriptionPanel={project.description ? <p className="project-ribbon-description">{project.description}</p> : null}
                images={[
                  { src: project.image, alt: project.imageAlt },
                  ...project.images.map((src, index) => ({ src, alt: project.imageAlts[index] || `${project.title}, study ${index + 1}` })),
                ]}
                initialSlide={{ title: project.title, description: project.description, year: String(project.year), category: project.category }}
              />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
