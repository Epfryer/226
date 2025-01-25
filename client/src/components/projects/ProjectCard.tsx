import { motion } from "framer-motion";
import { useState, useRef } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCarousel } from "./ProjectCarousel";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onExpand: (id: string | null) => void;
}

export function ProjectCard({ project, isExpanded, onExpand }: ProjectCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const content = [
    { image: project.image, text: project.description },
    { image: project.image, text: "" },
    { image: project.image, text: "" },
  ];

  return (
    <motion.div 
      layout
      className={`relative w-full overflow-hidden mb-4 project-card-container ${
        isExpanded ? 'project-card-expanded' : ''
      }`}
      initial={false}
    >
      <motion.div 
        layout
        className={`w-full mx-auto transition-all duration-300 ${
          isExpanded ? 'max-w-none' : 'max-w-3xl'
        }`}
      >
        {!isExpanded ? (
          // Centered non-expanded view
          <div 
            className="container mx-auto max-w-3xl px-4 cursor-pointer" 
            onClick={() => onExpand(project.id)}
          >
            <div className="flex items-center justify-center gap-8">
              <div className="flex-1 text-right">
                <h3 className="text-[calc(0.875rem+0.1vw)] font-medium truncate">
                  {project.title}
                </h3>
                <p className="text-[calc(0.75rem+0.1vw)] text-gray-600 mt-1 truncate">
                  {project.location}
                </p>
              </div>
              <motion.div
                className="w-[200px] relative aspect-[11/17]" 
                whileHover={{ scale: 0.98 }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-contain rounded-sm" 
                />
              </motion.div>
            </div>
          </div>
        ) : (
          // Expanded view with multi-item carousel
          <div className="relative w-screen -ml-[50vw] left-1/2">
            <div className="h-[60vh]">
              <ProjectCarousel 
                images={content.map(item => item.image)}
                onSlideChange={setCurrentIndex}
                initialSlide={{
                  title: project.title,
                  description: project.description,
                  year: project.year.toString(),
                  category: project.category
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}