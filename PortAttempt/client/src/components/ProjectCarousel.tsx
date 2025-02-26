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
    <div className="relative">
      {/* Project Info Section - Before Carousel */}
      <div className="mb-8 px-8">
        <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
        <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
        <div className="mt-3 flex gap-4 text-sm text-gray-500">
          <span>{initialSlide.year}</span>
          <span>{initialSlide.category}</span>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="relative h-full pb-12">
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
          className="w-full project-carousel"
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
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide 
              key={index}
              style={{
                width: 'auto',
                height: '100%',
                aspectRatio: '17/11',
                marginLeft: index === 0 ? '5%' : '0'
              }}
              className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]"
            >
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    aspectRatio: '17/11'
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
