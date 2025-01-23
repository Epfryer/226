import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="border-b border-gray-100 overflow-hidden"
      initial={false}
      animate={{ height: "auto" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Compact Tile View */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="py-6 cursor-pointer"
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
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-6"
          >
            <p className="text-sm text-gray-600">{project.description}</p>
            <div className="mt-4">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {project.category}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}