import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onExpand: (id: string | null) => void;
}

export function ProjectCard({ project, isExpanded, onExpand }: ProjectCardProps) {
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
      className="group relative w-full overflow-hidden mb-[calc(2vh)]"
      initial={false}
    >
      <motion.div 
        layout
        className={`relative mx-auto transition-all ${
          isExpanded 
            ? "w-[95vw] max-w-[1400px] px-[calc(2vw)]" 
            : "w-[80vw] max-w-[1000px] px-[calc(1vw)]"
        } py-[calc(1vh)]`}
        style={{
          left: isExpanded ? '50%' : 'auto',
          transform: isExpanded ? 'translateX(-50%)' : 'none'
        }}
      >
        {!isExpanded ? (
          <div 
            className="grid grid-cols-[1fr,minmax(120px,15vw)] gap-[calc(1vw)] items-center w-full cursor-pointer mx-auto" 
            onClick={() => onExpand(project.id)}
          >
            <div className="text-right w-full">
              <h3 className="text-[calc(0.875rem+0.1vw)] font-medium truncate">
                {project.title}
              </h3>
              <p className="text-[calc(0.75rem+0.1vw)] text-gray-600 mt-[calc(0.25vh)] truncate">
                {project.location}
              </p>
            </div>

            <motion.div
              className="relative aspect-video w-full"
              whileHover={{ scale: 0.98 }}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        ) : (
          <div className="w-full">
            <div className="mb-[calc(1vh)]">
              <h3 className="text-[calc(0.875rem+0.2vw)] font-medium">
                {project.title}
              </h3>
              <p className="text-[calc(0.75rem+0.1vw)] text-gray-600 mt-[calc(0.5vh)]">
                {project.location}
              </p>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-[17/11]"
                >
                  <img
                    src={content[currentIndex].image}
                    alt={`${project.title} view ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

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
                  onExpand(null);
                  setCurrentIndex(0);
                }}
                className="absolute top-4 right-4 text-sm text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-[calc(1vh)]"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-gray-600 max-w-[90ch] text-[calc(0.875rem+0.1vw)]"
                >
                  {content[currentIndex].text}
                </motion.p>
              </AnimatePresence>
              <div className="mt-[calc(1vh)] flex gap-[calc(1vw)] text-[calc(0.75rem+0.1vw)] text-gray-500">
                <span>{project.year}</span>
                <span>{project.category}</span>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}