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
      className="relative w-full overflow-hidden mb-4"
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
                className="w-[200px] relative aspect-[17/11]"
                whileHover={{ scale: 0.98 }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover rounded-sm"
                />
              </motion.div>
            </div>
          </div>
        ) : (
          // Expanded view with multi-item carousel
          <div className="relative w-screen -ml-[50vw] left-1/2">
            <div className="max-w-[90vw] mx-auto">
              <div ref={carouselRef} className="grid grid-cols-[300px,1fr] gap-8 p-4">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{content[currentIndex].text}</p>
                  <div className="mt-4 flex gap-4 text-sm text-gray-500">
                    <span>{project.year}</span>
                    <span>{project.category}</span>
                  </div>
                </div>
                <div className="relative h-[60vh]">
                  <ProjectCarousel 
                    images={content.map(item => item.image)}
                    onSlideChange={setCurrentIndex}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}