import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import type { Project } from '@/lib/projects';

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const index = Math.round(scrollPosition / window.innerWidth);
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * window.innerWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX;
    scrollLeft.current = carouselRef.current?.scrollLeft || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    const x = e.touches[0].pageX;
    const walk = (x - startX.current) * 2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollToIndex(Math.max(0, currentIndex - 1));
      } else if (e.key === 'ArrowRight') {
        scrollToIndex(Math.min(projects.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, projects.length]);

  const handleClose = () => {
    // Add close logic here if needed
  };

  return (
    <div className="group relative h-[80vh] overflow-hidden">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {/* Navigation controls */}
      <button 
        onClick={() => scrollToIndex(currentIndex - 1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      {/* Carousel container */}
      <div 
        ref={carouselRef}
        className="h-full snap-x snap-mandatory overflow-x-auto scroll-smooth hide-scrollbar"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {projects.map((project, index) => (
          <div 
            key={project.id} 
            className="snap-start w-screen h-full flex-shrink-0"
          >
            <div className="grid grid-cols-2 h-full max-w-4xl mx-auto">
              <div className="p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold">{project.title}</h3>
                <p className="mt-4 text-gray-600">{project.description}</p>
                <div className="mt-6 flex gap-4 text-sm text-gray-500">
                  {project.metadata.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Image 
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => scrollToIndex(currentIndex + 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
