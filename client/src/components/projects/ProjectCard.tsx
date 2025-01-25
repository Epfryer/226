import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCarousel } from "./ProjectCarousel";
import { useProject } from "@/context/ProjectContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
      className={`relative w-full mx-auto px-4 sm:px-6 lg:px-8 mb-8 ${
        isExpanded ? 'fixed inset-x-0 top-1/2 -translate-y-1/2 z-50' : ''
      }`}
      initial={false}
    >
      <motion.div 
        layout="position"
        className={`w-full mx-auto transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-w-7xl' : 'max-w-3xl'
        }`}
      >
        {!isExpanded ? (
          <motion.div 
            className="w-full cursor-pointer" 
            onClick={handleExpand}
            whileHover={{ scale: 0.99 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div 
                className="w-full md:w-1/2 text-center md:text-right space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h3 className="text-lg md:text-xl font-medium">
                  {project.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {project.location}
                </p>
              </motion.div>
              <motion.div 
                className="w-full md:w-1/2"
                whileHover={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <AspectRatio ratio={4/3} className="overflow-hidden rounded-sm">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-h-[90vh] overflow-y-auto">
            <motion.div 
              className="relative aspect-[16/9] w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ProjectCarousel 
                images={[project.image, project.image, project.image]}
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