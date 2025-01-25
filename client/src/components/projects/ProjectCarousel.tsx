import { useCallback, useEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProjectCarouselProps {
  images: string[];
  onSlideChange?: (index: number) => void;
}

export function ProjectCarousel({ images, onSlideChange }: ProjectCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      onSlideChange?.(api.selectedScrollSnap());
    });
  }, [api, onSlideChange]);

  if (!images?.length) return null;

  return (
    <Carousel
      className="w-full h-full"
      setApi={setApi}
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index}>
            <div className="h-full w-full relative">
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}