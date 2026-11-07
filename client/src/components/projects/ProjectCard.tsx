import { motion } from "framer-motion";
import { useId, useRef, useEffect } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCarousel } from "./ProjectCarousel";
import { responsiveImageProps } from "@/lib/responsive-images";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onExpand: (id: string | null) => void;
}

export function ProjectCard({ project, isExpanded, onExpand }: ProjectCardProps) {
  const panelId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && cardRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const cardElement = cardRef.current;
      const viewportHeight = window.innerHeight;
      const cardRect = cardElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = Math.max(0, scrollTop + cardRect.top - Math.min(120, viewportHeight * 0.14));

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }, [isExpanded]);

  const handleExpand = () => {
    onExpand(isExpanded ? null : project.id);
  };

  return (
    <motion.div 
      ref={cardRef}
      layout="position"
      className={`project-archive-card${isExpanded ? " is-expanded" : ""}`}
      initial={false}
    >
      <div className="project-archive-card-content">
        <button
          type="button"
          onClick={handleExpand}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${project.title}`}
          aria-describedby={`${panelId}-caption`}
          className="project-archive-trigger"
        >
          <span className="project-archive-image-wrap">
            <img
              {...responsiveImageProps(project.image, "(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 36vw")}
              alt={project.imageAlt}
              className="project-archive-image"
              loading="lazy"
              decoding="async"
            />
          </span>
          <span id={`${panelId}-caption`} className="project-archive-caption">
            <span className="project-archive-caption-main">
              <span className="project-archive-title">{project.title}</span>
              <span className="project-archive-location">{project.location}</span>
            </span>
            <span className="project-archive-caption-meta">
              <span>{project.year}</span>
              <span>{project.category}</span>
            </span>
            <span className="project-archive-action" aria-hidden="true">
              {isExpanded ? "Collapse −" : "Open +"}
            </span>
          </span>
        </button>
        <div id={panelId} className="project-archive-expanded-panel" hidden={!isExpanded}>
          {isExpanded && (
            <div ref={carouselRef} className="project-archive-carousel">
              <motion.div
                className="project-archive-carousel-frame"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <ProjectCarousel
                  images={[
                    { src: project.image, alt: project.imageAlt },
                    ...project.images.map((src, index) => ({ src, alt: project.imageAlts[index] }))
                  ]}
                  initialSlide={{
                    title: project.title,
                    description: project.description,
                    year: project.year.toString(),
                    category: project.category
                  }}
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}