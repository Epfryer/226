import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <motion.div 
      layout
      className="border-b border-gray-100 overflow-hidden group"
      initial={false}
    >
      <motion.div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="py-6 cursor-pointer"
        whileHover={{ opacity: 0.7 }}
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

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: { duration: 0.3 }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: { duration: 0.2 }
            }}
            className="relative pb-12 w-full max-w-4xl mx-auto"
          >
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              <div className="flex gap-8">
                {/* Project Details */}
                <div 
                  className="flex-none w-[600px] scroll-snap-align-start p-4"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <h4 className="text-lg font-medium mb-4">{project.title}</h4>
                  <p className="text-gray-600 mb-6">{project.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{project.location}</span>
                    <span>{project.year}</span>
                    <span>{project.category}</span>
                  </div>
                </div>

                {/* Project Images */}
                {[project.image, project.image, project.image].map((img, i) => (
                  <div 
                    key={i}
                    className="flex-none w-[600px] aspect-video scroll-snap-align-start"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <img
                      src={img}
                      alt={`${project.title} view ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Navigation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScroll('left');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScroll('right');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}