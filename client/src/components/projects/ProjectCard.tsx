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
      className={`relative w-full max-w-[min(100vw-2rem,1200px)] mx-auto overflow-hidden mb-[clamp(1rem,2vw,2rem)] ${
        isExpanded ? 'project-card-expanded' : ''
      }`}
      initial={false}
    >
      <motion.div 
        layout="position"
        className={`w-full mx-auto transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-w-none' : 'max-w-[min(100vw-2rem,900px)]'
        }`}
      >
        {!isExpanded ? (
          <motion.div 
            className="container mx-auto px-[clamp(1rem,3vw,2rem)] cursor-pointer" 
            onClick={handleExpand}
            whileHover={{ scale: 0.99 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-[clamp(1rem,3vw,2rem)]">
              <motion.div 
                className="flex-1 text-center md:text-right space-y-[clamp(0.5rem,1vw,1rem)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h3 className="text-[clamp(1rem,1.5vw,1.25rem)] font-medium leading-tight">
                  {project.title}
                </h3>
                <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-gray-600">
                  {project.location}
                </p>
              </motion.div>
              <motion.div 
                className="relative w-full md:w-[min(280px,40vw)]"
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
          <div ref={carouselRef} className="relative w-screen -ml-[50vw] left-1/2">
            <motion.div 
              className="h-[min(80vh,800px)]"
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