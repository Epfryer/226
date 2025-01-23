import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCarousel } from "./ProjectCarousel";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.div 
        layout
        className="border-b border-gray-100 overflow-hidden"
        initial={false}
      >
        <motion.div 
          onClick={() => setIsExpanded(true)}
          className="py-6 cursor-pointer group"
          whileHover={{ opacity: 0.7 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-[120px,1fr] gap-4 items-center">
            <div>
              <h3 className="text-sm font-medium">{project.title}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {project.location}
              </p>
            </div>

            <motion.div
              className="relative aspect-video w-full max-w-sm"
              whileHover={{ scale: 0.98 }}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <ProjectCarousel 
            project={project} 
            onClose={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}