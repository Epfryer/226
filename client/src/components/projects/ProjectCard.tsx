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
  const { setProjectExpanded } = useProject();

  useEffect(() => {
    setProjectExpanded(isExpanded);
  }, [isExpanded, setProjectExpanded]);

  const handleExpand = () => {
    onExpand(isExpanded ? null : project.id);
  };

  return (
    <motion.div 
      ref={cardRef}
      layout="position"
      className={`relative w-full mx-auto ${
        isExpanded ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm' : ''
      }`}
      initial={false}
    >
      <motion.div 
        layout="position"
        className={`w-full mx-auto px-6 md:px-12 transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-w-[95vw] px-0' : 'max-w-[1400px]'
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
          <motion.div 
            className="relative aspect-[17/11] w-full bg-white"
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
        )}
      </motion.div>
    </motion.div>
  );
}