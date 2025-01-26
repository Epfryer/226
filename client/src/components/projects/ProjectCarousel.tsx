import { useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, A11y } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
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
    <div className="relative w-full overflow-hidden flex justify-center">
      <Swiper
        modules={[Navigation, FreeMode, A11y]}
        slidesPerView="auto"
        spaceBetween={0}
        centeredSlides={true}
        navigation={false}
        className="w-full h-full max-w-[1800px]"
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
          }
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide 
            key={index}
            className="!w-auto max-w-[90vw] h-full flex justify-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-[400px,1fr] gap-4 h-full">
              {index === 0 && (
                <div className="pl-8 pt-8 pr-4">
                  <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>{initialSlide.year}</span>
                    <span>{initialSlide.category}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center">
                <div className="w-full">
                  <img
                    src={image}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}