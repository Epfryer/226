import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects";
import { useEffect, useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { useReducedMotion } from "framer-motion";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const { setProjectExpanded } = useProject();
  useEffect(() => {
    setProjectExpanded(expandedId !== null);
    return () => setProjectExpanded(false);
  }, [expandedId, setProjectExpanded]);

  return (
    <motion.div
      className="project-archive-grid"
      layout
      role="list"
      aria-label="Projects"
    >
      <AnimatePresence>
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            layout
            className={`project-archive-item project-archive-item-${index % 8}${expandedId === project.id ? " is-expanded" : ""}`}
            role="listitem"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
          >
            <ProjectCard 
              project={project}
              isExpanded={expandedId === project.id}
              onExpand={(id) => setExpandedId((current) => id === current ? null : id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}