import { useCallback, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar, FreeMode, A11y } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    onSlideChange?.(swiper.activeIndex);
  }, [onSlideChange]);

  const handleImageDoubleClick = (image: string) => {
    setZoomImage(image);
  };

  const handleZoomedImageDoubleClick = () => {
    setZoomImage(null);
  };

  if (!images?.length) return null;

  return (
    <>
      <div className="relative w-full h-full">
        <Swiper
          modules={[Navigation, Scrollbar, FreeMode, A11y]}
          slidesPerView="auto"
          spaceBetween={0}
          centeredSlides={false}
          scrollbar={false}
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
          grabCursor={false}
          preventClicks={false}
          preventClicksPropagation={false}
          touchStartPreventDefault={false}
          resistance={false}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
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
          <SwiperSlide className="w-full sm:w-auto sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] h-full">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-4 h-full">
              <div className="p-4 md:p-8">
                <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
                <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  <span>{initialSlide.year}</span>
                  <span>{initialSlide.category}</span>
                </div>
              </div>
              <div className="relative flex items-center justify-center h-full min-h-[300px] max-h-[70vh]">
                <img
                  src={images[0]}
                  alt={`Slide 1`}
                  className={`w-full h-full object-contain cursor-zoom-in transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}
                  loading="eager"
                  onDoubleClick={() => handleImageDoubleClick(images[0])}
                />
              </div>
            </div>
          </SwiperSlide>

          {/* Rest of the slides */}
          {images.slice(1).map((image, index) => (
            <SwiperSlide 
              key={index + 1}
              className="w-full sm:w-auto sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] h-full"
            >
              <div className="relative flex items-center justify-center h-full min-h-[300px] max-h-[70vh]">
                <img
                  src={image}
                  alt={`Slide ${index + 2}`}
                  className={`w-full h-full object-contain cursor-zoom-in transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}
                  loading="lazy"
                  onDoubleClick={() => handleImageDoubleClick(image)}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-screen-lg w-[95vw] h-[90vh] p-0">
          <div className="w-full h-full flex items-center justify-center bg-black/90">
            <img
              src={zoomImage || ''}
              alt="Zoomed view"
              className="max-w-full max-h-full object-contain cursor-zoom-out"
              onDoubleClick={handleZoomedImageDoubleClick}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}