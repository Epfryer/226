import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <motion.div 
      className="space-y-0"
      layout
    >
      <AnimatePresence>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}