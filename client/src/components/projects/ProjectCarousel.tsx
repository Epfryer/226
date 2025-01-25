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
    <div className="relative h-full">
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
        className="w-full h-full project-carousel"
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
      >
        {/* First slide with text overlay */}
        <SwiperSlide className="!w-full aspect-[17/11] relative">
          <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
            <div className="bg-black/80 text-white p-8 flex flex-col justify-center">
              <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{initialSlide.description}</p>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{initialSlide.year}</span>
                <span>{initialSlide.category}</span>
              </div>
            </div>
            <div className="relative aspect-[17/11]">
              <img
                src={images[0]}
                alt={`Slide 1`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </SwiperSlide>

        {/* Rest of the slides */}
        {images.slice(1).map((image, index) => (
          <SwiperSlide 
            key={index + 1}
            className="!w-full aspect-[17/11] relative"
          >
            <img
              src={image}
              alt={`Slide ${index + 2}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}