import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects";
import { useState } from "react";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.div
      className="space-y-0"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      layout
    >
      <AnimatePresence>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            variants={fadeInUp}
            layout
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 20 }}
          >
            <ProjectCard 
              project={project}
              isExpanded={expandedId === project.id}
              onExpand={(id) => setExpandedId(id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}