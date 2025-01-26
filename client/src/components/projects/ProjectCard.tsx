import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCarousel } from "./ProjectCarousel";
import { useProject } from "@/context/ProjectContext";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onExpand: (id: string | null) => void;
}

export function ProjectCard({ project, isExpanded, onExpand }: ProjectCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { setProjectExpanded } = useProject();

  useEffect(() => {
    setProjectExpanded(isExpanded);

    if (isExpanded && cardRef.current) {
      const cardElement = cardRef.current;
      const viewportHeight = window.innerHeight;
      const cardRect = cardElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = scrollTop + cardRect.top - (viewportHeight - cardRect.height) / 2;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }, [isExpanded, setProjectExpanded]);

  const handleExpand = () => {
    onExpand(isExpanded ? null : project.id);
  };

  return (
    <motion.div 
      ref={cardRef}
      layout="position"
      className={`relative w-full overflow-hidden mb-4 ${
        isExpanded ? 'project-card-expanded' : ''
      }`}
      initial={false}
    >
      <motion.div 
        layout="position"
        className={`w-full mx-auto transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-w-none' : 'max-w-3xl'
        }`}
      >
        {!isExpanded ? (
          <motion.div 
            className="container mx-auto max-w-3xl px-4 cursor-pointer" 
            onClick={handleExpand}
            whileHover={{ scale: 0.99 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <motion.div 
                className="flex-1 text-center md:text-right"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h3 className="text-[calc(0.875rem+0.1vw)] font-medium truncate transition-all duration-300 ease-in-out">
                  {project.title}
                </h3>
                <p className="text-[calc(0.75rem+0.1vw)] text-gray-600 mt-1 truncate transition-all duration-300 ease-in-out">
                  {project.location}
                </p>
              </motion.div>
              <motion.div 
                className="relative w-full md:w-[280px]"
                whileHover={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-auto object-contain rounded-sm transition-transform duration-300 ease-in-out"
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div ref={carouselRef} className="relative w-screen -ml-[50vw] left-1/2">
            <motion.div 
              className="h-[80vh] max-h-[800px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ProjectCarousel 
                images={[project.image, ...project.images]} // Main image first, followed by additional images
                onSlideChange={setCurrentIndex}
                initialSlide={{
                  title: project.title,
                  description: project.description,
                  year: project.year.toString(),
                  category: project.category
                }}
              />
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}