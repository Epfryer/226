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
  initialSlide: {
    title: string;
    description: string;
    year: string;
    category: string;
  };
}

export function ProjectCarousel({ images, onSlideChange, initialSlide }: ProjectCarouselProps) {
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    onSlideChange?.(swiper.activeIndex);
  }, [onSlideChange]);

  if (!images?.length) return null;

  return (
    <div className="relative h-full pb-12"> {/* Added padding bottom for scrollbar */}
      <Swiper
        modules={[Navigation, Scrollbar]}
        slidesPerView="auto"
        spaceBetween={24}
        centeredSlides={false}
        scrollbar={{ draggable: true }}
        navigation={false}
        className="w-full h-full project-carousel"
        onSlideChange={handleSlideChange}
        initialSlide={0}
      >
        {/* First slide with text */}
        <SwiperSlide 
          style={{
            width: 'auto',
            maxWidth: '85%',
            height: '100%',
            marginLeft: '5%'  // Reduced left margin to start more from the left
          }}
        >
          <div className="grid grid-cols-[400px,1fr] gap-8 h-full">
            <div className="p-8">
              <h3 className="text-xl font-semibold mb-4">{initialSlide.title}</h3>
              <p className="mt-2 text-sm text-gray-600 mb-6">{initialSlide.description}</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>{initialSlide.year}</span>
                <span>{initialSlide.category}</span>
              </div>
            </div>
            <div className="h-full relative" style={{ maxHeight: '800px' }}> 
              <div className="h-full aspect-[11/17]"> {/* Updated aspect ratio */}
                <img
                  src={images[0]}
                  alt={`Slide 1`}
                  className="h-full w-full object-contain" /* Changed to object-contain */
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
              maxWidth: '75%',
              height: '100%',
            }}
          >
            <div className="h-full relative" style={{ maxHeight: '800px' }}>
              <div className="h-full aspect-[11/17]"> {/* Updated aspect ratio */}
                <img
                  src={image}
                  alt={`Slide ${index + 2}`}
                  className="h-full w-full object-contain" /* Changed to object-contain */
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}