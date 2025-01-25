import { useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';

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

  // Function to scroll to a specific slide and center it
  const scrollToSlide = useCallback((index: number) => {
    if (!swiperRef.current) return;

    const swiper = swiperRef.current;
    const slideWidth = swiper.slides[index]?.offsetWidth || 0;
    const windowWidth = window.innerWidth;
    const offset = (windowWidth - slideWidth) / 2;

    swiper.slideTo(index, 300, false);
    swiper.setTranslate(-slideWidth * index + offset);
  }, []);

  if (!images?.length) return null;

  return (
    <div className="relative h-full pb-12">
      <Swiper
        modules={[Navigation, Scrollbar]}
        slidesPerView="auto"
        spaceBetween={0}
        centeredSlides={false}
        scrollbar={{ draggable: true }}
        navigation={false}
        className="w-full h-full project-carousel"
        onSlideChange={handleSlideChange}
        initialSlide={0}
        freeMode={true}
        allowTouchMove={true}
        resistance={false}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        breakpoints={{
          // Mobile
          320: {
            slidesPerView: 1,
            spaceBetween: 0
          },
          // Tablet
          768: {
            slidesPerView: "auto",
            spaceBetween: 0
          },
          // Desktop
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
          <div className="grid grid-cols-1 md:grid-cols-[400px,1fr] gap-8 h-full">
            <div className="pt-4">
              <h3 className="text-xl font-semibold mb-4">{initialSlide.title}</h3>
              <p className="mt-2 text-sm text-gray-600 mb-6">{initialSlide.description}</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
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

      {/* Navigation dots */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === swiperRef.current?.activeIndex
                ? 'bg-gray-800'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}