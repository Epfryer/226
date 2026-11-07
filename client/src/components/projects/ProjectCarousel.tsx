import { useCallback, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar, FreeMode, A11y, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';

interface ProjectImage {
  src: string;
  alt: string;
}

interface ProjectCarouselProps {
  images: ProjectImage[];
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
  const [zoomImage, setZoomImage] = useState<ProjectImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
    setAtStart(swiper.isBeginning);
    setAtEnd(swiper.isEnd);
    onSlideChange?.(swiper.activeIndex);
  }, [onSlideChange]);

  const handleImageDoubleClick = (e: React.MouseEvent<HTMLImageElement>, image: ProjectImage) => {
    if (zoomImage) {
      setZoomImage(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomImage(image);
    setScale(2.5);
    setPosition({ x, y });
  };

  const handleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomImage || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  const resetZoom = () => {
    setZoomImage(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!images?.length) return null;

  return (
    <>
      <section aria-label={`${initialSlide.title} gallery`} aria-roledescription="carousel" className="relative w-full h-full flex flex-col">
        <div className="flex shrink-0 items-center justify-center gap-4 px-4 pb-3">
          <Button type="button" variant="outline" disabled={atStart}
            aria-label={`Previous image in ${initialSlide.title}`}
            onClick={() => swiperRef.current?.slidePrev()}>
            Previous
          </Button>
          <p className="text-sm" role="status" aria-live="polite" aria-atomic="true">
            Image {currentIndex + 1} of {images.length}
          </p>
          <Button type="button" variant="outline" disabled={atEnd}
            aria-label={`Next image in ${initialSlide.title}`}
            onClick={() => swiperRef.current?.slideNext()}>
            Next
          </Button>
        </div>
        <Swiper
          modules={[Navigation, Scrollbar, FreeMode, A11y, Mousewheel]}
          slidesPerView="auto"
          spaceBetween={-1}
          centeredSlides={false}
          scrollbar={false}
          navigation={false}
          className="w-full flex-1 min-h-0 project-carousel"
          onSlideChange={handleSlideChange}
          onProgress={(swiper) => {
            setAtStart(swiper.isBeginning);
            setAtEnd(swiper.isEnd);
          }}
          onResize={handleSlideChange}
          initialSlide={0}
          allowTouchMove={true}
          simulateTouch={true}
          mousewheel={false}
          freeMode={{
            enabled: true,
            momentumBounce: false,
            momentumRatio: 0.1,
            momentumVelocityRatio: 0.1
          }}
          touchRatio={1}
          resistance={false}
          touchAngle={45}
          grabCursor={true}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            handleSlideChange(swiper);
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
                  src={images[0].src}
                  alt={images[0].alt}
                  className={`w-full h-full object-contain cursor-grab transition-all duration-300`}
                  loading="eager"
                  onDoubleClick={(e) => handleImageDoubleClick(e, images[0])}
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
                  src={image.src}
                  alt={image.alt}
                  className={`w-full h-full object-contain cursor-grab transition-all duration-300`}
                  loading="lazy"
                  onDoubleClick={(e) => handleImageDoubleClick(e, image)}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <Dialog open={!!zoomImage} onOpenChange={resetZoom}>
        <DialogContent className="max-w-screen-lg w-[95vw] h-[90vh] p-0">
          <DialogTitle className="sr-only">{initialSlide.title} — enlarged image</DialogTitle>
          <div className="w-full h-full flex items-center justify-center bg-black/90">
            <img
              ref={imageRef}
              src={zoomImage?.src || ''}
              alt={zoomImage?.alt || ''}
              style={{
                transformOrigin: `${position.x}% ${position.y}%`,
                transform: `scale(${scale})`,
              }}
              className="w-auto h-auto max-w-full max-h-full object-contain cursor-zoom-out transition-transform duration-200"
              onDoubleClick={(e) => zoomImage && handleImageDoubleClick(e, zoomImage)}
              onMouseMove={handleZoom}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}