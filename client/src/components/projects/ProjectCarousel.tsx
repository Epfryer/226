import { useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar, FreeMode } from 'swiper/modules';
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
    <div className="relative h-full pb-12">
      <Swiper
        modules={[Navigation, Scrollbar, FreeMode]}
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
          momentumRatio: 0,
          momentumBounce: false,
          minimumVelocity: 0.02
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
        {/* First slide with text */}
        <SwiperSlide 
          style={{
            width: 'auto',
            maxWidth: '90%',
            height: '100%',
            marginLeft: '5%'
          }}
          className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]"
        >
          <div className="grid grid-cols-1 md:grid-cols-[400px,1fr] gap-4 h-full">
            <div className="pl-8 pt-8 pr-4">
              <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
              <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
              <div className="mt-3 flex gap-4 text-sm text-gray-500">
                <span>{initialSlide.year}</span>
                <span>{initialSlide.category}</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full">
                <img
                  src={images[0]}
                  alt={`Slide 1`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </SwiperSlide>

        {/* Rest of the slides without text */}
        {images.slice(1).map((image, index) => (
          <SwiperSlide 
            key={index + 1}
            style={{
              width: 'auto',
              maxWidth: '90%',
              height: '100%',
            }}
            className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]"
          >
            <div className="flex items-center justify-center h-full">
              <div className="w-full">
                <img
                  src={image}
                  alt={`Slide ${index + 2}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}