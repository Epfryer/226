import { useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar, FreeMode, A11y } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';

interface ProjectCarouselProps {
  images: string[];
  onSlideChange?: (index: number) => void;
  initialSlide: {
    title: string;
    description: string;
    year: string;
    category: string;
  };
}

export function ProjectCarousel({ images, onSlideChange, initialSlide }: ProjectCarouselProps) {
  const swiperRef = useRef<SwiperType>();

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    onSlideChange?.(swiper.activeIndex);
  }, [onSlideChange]);

  if (!images?.length) return null;

  return (
    <Swiper
      modules={[Navigation, Scrollbar, FreeMode, A11y]}
      slidesPerView="auto"
      spaceBetween={0}
      centeredSlides={false}
      scrollbar={{ 
        draggable: true,
        dragSize: 60,
        el: '.swiper-scrollbar'
      }}
      navigation={false}
      className="project-carousel"
      style={{ margin: 0, padding: 0 }}
      onSlideChange={handleSlideChange}
      initialSlide={0}
      freeMode={{
        enabled: true,
        sticky: false,
        momentumRatio: 0.15,
        momentumBounce: false,
        momentumVelocityRatio: 0.5,
        minimumVelocity: 0.1
      }}
      touchEventsTarget="container"
      touchRatio={2}
      touchAngle={30}
      longSwipes={false}
      shortSwipes={true}
      followFinger={true}
      grabCursor={true}
      preventClicks={false}
      preventClicksPropagation={false}
      touchStartPreventDefault={false}
      resistance={false}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
      breakpoints={{
        320: {
          slidesPerView: 1,
          spaceBetween: 0
        },
        768: {
          slidesPerView: "auto",
          spaceBetween: 0
        },
        1024: {
          slidesPerView: "auto",
          spaceBetween: 0
        }
      }}
    >
      <SwiperSlide className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-[400px,1fr] gap-4">
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
            <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
            <div className="mt-3 flex gap-4 text-sm text-gray-500">
              <span>{initialSlide.year}</span>
              <span>{initialSlide.category}</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src={images[0]}
              alt={`Slide 1`}
              className="w-full h-full object-contain"
              style={{ aspectRatio: '3/2' }}
            />
          </div>
        </div>
      </SwiperSlide>

      {images.slice(1).map((image, index) => (
        <SwiperSlide 
          key={index + 1}
          className="w-full flex items-center justify-center"
        >
          <img
            src={image}
            alt={`Slide ${index + 2}`}
            className="w-full h-full object-contain"
            style={{ aspectRatio: '3/2' }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}