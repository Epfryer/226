import { motion } from "framer-motion";
import { useState } from "react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-24">
      <motion.div
        layout
        className="overflow-hidden"
        initial={false}
        animate={{ height: isExpanded ? "auto" : "auto" }}
      >
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer"
        >
          <div className="grid grid-cols-[200px,1fr] gap-12 items-start">
            <div className="pt-4">
              <h3 className="text-lg font-medium">{project.title}</h3>
              <p className="text-gray-600 mt-2 text-sm">
                {project.location}, {project.year}
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 0.98 }}
              className="relative aspect-[3/2] max-w-2xl"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8"
          >
            <div className="overflow-x-auto pb-8">
              <div className="flex gap-8" style={{ minWidth: "max-content" }}>
                <div className="w-96">
                  <h4 className="font-medium mb-4">About the Project</h4>
                  <p className="text-gray-600">{project.description}</p>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-sm rounded">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div className="flex gap-8">
                  {[project.image, project.image, project.image].map((img, i) => (
                    <div key={i} className="w-96 aspect-[3/2] flex-shrink-0">
                      <img
                        src={img}
                        alt={`${project.title} view ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}