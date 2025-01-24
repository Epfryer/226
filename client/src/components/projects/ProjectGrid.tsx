import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects";
import { useState } from "react";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex flex-col items-center"
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
                className="w-full flex justify-center py-4"
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
      </div>
    </div>
  );
}