import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock additional content for demo - replace with actual project content
  const content = [
    { image: project.image, text: project.description },
    { image: project.image, text: "Additional details about the project process." },
    { image: project.image, text: "More information about outcomes and impact." }
  ];

  const handleNavigation = (direction: 'prev' | 'next') => {
    setCurrentIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? content.length - 1 : prev - 1;
      }
      return prev === content.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <motion.div 
      layout
      className="border-b border-gray-100 group"
      initial={false}
    >
      <motion.div 
        layout
        className={`grid ${isExpanded ? 'grid-cols-[1fr,2fr]' : 'grid-cols-[120px,1fr]'} gap-8 items-start py-6`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <motion.div layout className="relative">
          <h3 className="text-sm font-medium">{project.title}</h3>
          <p className="text-xs text-gray-600 mt-1">
            {project.location}
          </p>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-gray-600"
                >
                  {content[currentIndex].text}
                </motion.p>
              </AnimatePresence>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>{project.year}</span>
                <span>{project.category}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`relative ${isExpanded ? 'aspect-[16/9]' : 'aspect-video max-w-sm'}`}
            >
              <img
                src={content[currentIndex].image}
                alt={`${project.title} view ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {isExpanded && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('prev');
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('next');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                  setCurrentIndex(0);
                }}
                className="absolute top-4 right-4 text-sm text-gray-500 hover:text-black"
              >
                Close
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}