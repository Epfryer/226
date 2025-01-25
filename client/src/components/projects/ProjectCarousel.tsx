import { useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';

interface ProjectCarouselProps {
  images: string[];
  onSlideChange?: (index: number) => void;
}

export function ProjectCarousel({ images, onSlideChange }: ProjectCarouselProps) {
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    onSlideChange?.(swiper.activeIndex);
  }, [onSlideChange]);

  if (!images?.length) return null;

  return (
    <Swiper
      modules={[Navigation, Scrollbar]}
      slidesPerView="auto"
      spaceBetween={24}
      centeredSlides={false}
      navigation={true}
      scrollbar={{ draggable: true }}
      className="w-full h-full project-carousel"
      onSlideChange={handleSlideChange}
      style={{
        paddingRight: '25%', // Add space for overflow items
      }}
    >
      {images.map((image, index) => (
        <SwiperSlide 
          key={index}
          style={{
            width: 'auto',
            maxWidth: '75%', // Limit slide width to show multiple items
            height: '100%',
          }}
        >
          <div className="h-full relative">
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}