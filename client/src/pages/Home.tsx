import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import { projectPath } from "@/lib/public-routes";
import { projectImageDimensions } from "@/lib/project-image-dimensions";
import { responsiveImageProps } from "@/lib/responsive-images";
import "@/styles/home-project-index.css";

const indexProjects = [...projects].sort((a, b) => b.year - a.year);
const transitionEase = [0.22, 1, 0.36, 1] as const;
type ProjectControls = {
  collapsed: HTMLButtonElement | null;
  expanded: HTMLButtonElement | null;
};

function ProjectMetadata({ project, number, expanded = false }: {
  project: Project;
  number: number;
  expanded?: boolean;
}) {
  return (
    <div className={`home-project-meta${expanded ? " home-project-meta--expanded" : ""}`}>
      <p className="home-project-index-number">{String(number).padStart(2, "0")} / {String(project.year)}</p>
      <h2 className="home-project-title">
        <Link href={projectPath(project)}>{project.title}</Link>
      </h2>
      <p className="home-project-subtitle">{project.category} · {project.location.trim()}</p>
    </div>
  );
}

function ProjectRow({
  project,
  number,
  isExpanded,
  reducedMotion,
  registerControl,
  onToggle,
}: {
  project: Project;
  number: number;
  isExpanded: boolean;
  reducedMotion: boolean;
  registerControl: (id: string, type: keyof ProjectControls, node: HTMLButtonElement | null) => void;
  onToggle: (id: string) => void;
}) {
  const galleryId = `project-gallery-${number}`;
  const coverLayoutId = `project-cover-${project.id}`;
  const coverDimensions = projectImageDimensions[project.id];
  const trackRef = useRef<HTMLDivElement>(null);
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.55, ease: transitionEase };
  const registerCollapsed = useCallback((node: HTMLButtonElement | null) => {
    registerControl(project.id, "collapsed", node);
  }, [project.id, registerControl]);
  const registerExpanded = useCallback((node: HTMLButtonElement | null) => {
    registerControl(project.id, "expanded", node);
  }, [project.id, registerControl]);
  const projectImages = [
    { src: project.image, alt: project.imageAlt },
    ...project.images.map((src, index) => ({
      src,
      alt: project.imageAlts[index] || `${project.title}, study ${index + 1}`,
    })),
  ];

  const scrollGallery = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.78, 240),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <motion.article
      layout
      transition={{ layout: reducedMotion ? { duration: 0 } : { duration: 0.55, ease: transitionEase } }}
      className="home-project-row"
      data-expanded={isExpanded}
    >
      {!isExpanded ? (
        <div className="home-project-collapsed">
          <ProjectMetadata project={project} number={number} />
          <motion.button
            ref={registerCollapsed}
            type="button"
            layoutId={coverLayoutId}
            transition={transition}
            className="home-project-cover home-project-cover--thumbnail"
            aria-expanded={false}
            aria-controls={galleryId}
            aria-label={`Expand ${project.title} gallery`}
            onClick={() => onToggle(project.id)}
          >
            <img
              {...responsiveImageProps(project.image, "(max-width: 767px) calc(100vw - 40px), 280px")}
              width={coverDimensions?.width}
              height={coverDimensions?.height}
              alt={project.imageAlt}
              loading={number === 1 ? "eager" : "lazy"}
              decoding="async"
            />
            <span className="home-project-cover-hint" aria-hidden="true">Open project</span>
          </motion.button>
        </div>
      ) : (
        <>
          <div className="home-project-expanded-heading">
            <ProjectMetadata project={project} number={number} expanded />
            <Link className="home-project-detail-link" href={projectPath(project)}>
              Full project <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div
            id={galleryId}
            className="home-project-gallery-region"
            role="region"
            aria-label={`${project.title} project gallery`}
          >
            <div className="home-gallery-controls">
              <button type="button" onClick={() => scrollGallery(-1)} aria-label={`Previous panels in ${project.title}`}>
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button type="button" onClick={() => scrollGallery(1)} aria-label={`Next panels in ${project.title}`}>
                <span>Next</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            <div ref={trackRef} className="home-gallery-track" tabIndex={0} aria-label={`${project.title} panels`}>
              <motion.button
                ref={registerExpanded}
                type="button"
                layoutId={coverLayoutId}
                transition={transition}
                className="home-gallery-panel home-gallery-panel--cover"
                aria-expanded={true}
                aria-controls={galleryId}
                aria-label={`Collapse ${project.title} gallery`}
                onClick={() => onToggle(project.id)}
              >
                <img
                  {...responsiveImageProps(project.image, "(max-width: 767px) 84vw, 68vw")}
                  width={coverDimensions?.width}
                  height={coverDimensions?.height}
                  alt={project.imageAlt}
                  loading="eager"
                  decoding="async"
                />
                <span className="home-gallery-collapse-hint">Close project <span aria-hidden="true">×</span></span>
              </motion.button>

              <motion.div
                className="home-gallery-panel home-gallery-panel--copy"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.28, delay: 0.22, ease: transitionEase }}
              >
                <p className="home-project-index-number">{project.year} · {project.category}</p>
                <h3>{project.title}</h3>
                <p className="home-gallery-location">{project.location.trim()}</p>
                <p className="home-gallery-description">{project.description}</p>
                <Link className="home-project-detail-link" href={projectPath(project)}>
                  View project <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </motion.div>

              {projectImages.slice(1).map((image, index) => (
                <motion.figure
                  key={`${project.id}-${image.src}`}
                  className="home-gallery-panel home-gallery-panel--art"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.24, delay: 0.2, ease: transitionEase }}
                >
                  <img
                    {...responsiveImageProps(image.src, "(max-width: 767px) 84vw, 68vw")}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </motion.figure>
              ))}
            </div>
          </div>
        </>
      )}
      {!isExpanded && (
        <div id={galleryId} className="home-project-gallery-region" hidden />
      )}
    </motion.article>
  );
}

export default function Home() {
  const reducedMotion = useReducedMotion();
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(() => new Set());
  const controls = useRef(new Map<string, ProjectControls>());
  const pendingFocus = useRef<{ id: string; expanded: boolean } | null>(null);

  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (pending) {
      controls.current.get(pending.id)?.[pending.expanded ? "expanded" : "collapsed"]?.focus({ preventScroll: true });
      pendingFocus.current = null;
    }
  }, [expandedProjectIds]);

  const registerControl = useCallback((
    id: string,
    type: keyof ProjectControls,
    node: HTMLButtonElement | null,
  ) => {
    const entry = controls.current.get(id) ?? { collapsed: null, expanded: null };
    entry[type] = node;
    controls.current.set(id, entry);
  }, []);

  const toggleProject = useCallback((id: string) => {
    const expanded = !expandedProjectIds.has(id);
    pendingFocus.current = { id, expanded };
    setExpandedProjectIds((current) => {
      const next = new Set(current);
      if (expanded) next.add(id);
      else next.delete(id);
      return next;
    });
  }, [expandedProjectIds]);

  return (
    <div className="home-project-index">
      <header className="home-index-header">
        <div className="home-index-header-inner">
          <Link className="home-index-wordmark" href="/" aria-label="D.EF — Ethan Fryer home" data-intro-brand>D.EF</Link>
          <nav className="home-index-nav" aria-label="Main navigation">
            <Link href="/about">About</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/publications">Publications</Link>
            <Link href="/studio">Studio</Link>
            <Link href="/account">Account</Link>
            <Link className="home-index-contact" href="/about#contact">Inquiries <ArrowUpRight size={13} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>

      <main className="home-index-main">
        <div className="home-index-intro">
          <p>Architecture · Images · Objects</p>
          <h1>Selected projects</h1>
        </div>

        <LayoutGroup id="home-project-index">
          <div className="home-project-list" aria-label="Selected architectural projects">
            {indexProjects.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                number={index + 1}
                isExpanded={expandedProjectIds.has(project.id)}
                reducedMotion={!!reducedMotion}
                registerControl={registerControl}
                onToggle={toggleProject}
              />
            ))}
          </div>
        </LayoutGroup>

        <div className="home-index-bottom">
          <Link href="/projects">Browse the project archive <ArrowRight size={15} aria-hidden="true" /></Link>
          <Link href="/about#contact">Start an inquiry <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </main>

    </div>
  );
}
