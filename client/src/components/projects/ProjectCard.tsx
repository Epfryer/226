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
            className="relative pb-6"
          >
            {/* Horizontal Scrolling Container */}
            <div 
              ref={scrollContainerRef}
              className="relative overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              <div className="flex gap-6">
                {/* About Section */}
                <div 
                  className="flex-none w-80 p-4 scroll-snap-align-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <div className="mt-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {project.category}
                    </span>
                  </div>
                </div>

                {/* Project Images */}
                {[project.image, project.image, project.image].map((img, i) => (
                  <div 
                    key={i}
                    className="flex-none w-80 aspect-video scroll-snap-align-start"
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

              {/* Scroll Navigation */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleScroll('left');
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleScroll('right');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}