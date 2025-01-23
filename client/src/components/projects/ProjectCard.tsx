import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-container-${project.id}`);
    if (!container) return;

    const scrollAmount = direction === 'left' ? -400 : 400;
    const newPosition = scrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });

    setScrollPosition(newPosition);
  };

  return (
    <div className="mb-12">
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
          <div className="grid grid-cols-[160px,1fr] gap-6 items-center">
            <div>
              <h3 className="text-base font-medium">{project.title}</h3>
              <p className="text-gray-600 mt-1 text-sm">
                {project.location}, {project.year}
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 0.98 }}
              className="relative aspect-[3/2] max-w-xl"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 relative overflow-hidden"
        >
          <div className="relative group">
            <div 
              id={`scroll-container-${project.id}`}
              className="overflow-x-auto scrollbar-hide pb-8 scroll-smooth"
            >
              <div className="flex gap-8" style={{ minWidth: "max-content" }}>
                <motion.div 
                  className="w-96 flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="font-medium mb-4">About the Project</h4>
                  <p className="text-gray-600">{project.description}</p>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-sm rounded">
                      {project.category}
                    </span>
                  </div>
                </motion.div>

                {[project.image, project.image, project.image].map((img, i) => (
                  <motion.div 
                    key={i} 
                    className="w-96 aspect-[3/2] flex-shrink-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={img}
                      alt={`${project.title} view ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleScroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleScroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}