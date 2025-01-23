import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "@/lib/projects";
import { useRef, useState } from "react";

interface ProjectCarouselProps {
  project: Project;
  onClose: () => void;
}

export function ProjectCarousel({ project, onClose }: ProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Mock additional images for demo - replace with actual project images
  const images = [project.image, project.image, project.image];
  const texts = [
    project.description,
    "Additional project details can be shown here.",
    "More information about the project process and outcomes."
  ];

  const handleScroll = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(images.length - 1, currentIndex + 1);
    
    setCurrentIndex(newIndex);
    carouselRef.current?.scrollTo({
      left: newIndex * window.innerWidth,
      behavior: 'smooth'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white"
    >
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 z-50 p-2 hover:opacity-70 transition-opacity"
      >
        <X size={24} />
      </button>

      <div 
        ref={carouselRef}
        className="h-screen flex overflow-x-hidden scroll-smooth"
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="w-screen flex-none"
          >
            <div className="h-screen grid grid-cols-2">
              <div className="p-12 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold mb-6">{project.title}</h2>
                  <p className="text-gray-600 mb-4">{texts[index]}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{project.location}</span>
                    <span>{project.year}</span>
                    <span>{project.category}</span>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                className="relative h-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <img
                  src={image}
                  alt={`${project.title} view ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          onClick={() => handleScroll('prev')}
          disabled={currentIndex === 0}
          className="p-2 hover:opacity-70 transition-opacity disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2 items-center">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-black' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => handleScroll('next')}
          disabled={currentIndex === images.length - 1}
          className="p-2 hover:opacity-70 transition-opacity disabled:opacity-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </motion.div>
  );
}
