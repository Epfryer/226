import { useCallback, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
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
  compact?: boolean;
  initialIndex?: number;
  leadingPanel?: ReactNode;
  descriptionPanel?: ReactNode;
  initialSlide: {
    title: string;
    description: string;
    year: string;
    category: string;
  };
}

export function ProjectCarousel({ images, onSlideChange, initialSlide, compact = false, initialIndex = 0, leadingPanel, descriptionPanel }: ProjectCarouselProps) {
  const reducedMotion = useReducedMotion();
  const swiperRef = useRef<SwiperType>();
  const [zoomImage, setZoomImage] = useState<ProjectImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [atStart, setAtStart] = useState(initialIndex === 0);
  const [atEnd, setAtEnd] = useState(initialIndex >= images.length - 1);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const imageTriggerRef = useRef<HTMLButtonElement | null>(null);
  const draggedRef = useRef(false);
  const hasDescriptionPanel = compact && !!descriptionPanel;
  const imageSlideIndex = (index: number) => index === 0 ? 1 : index + (hasDescriptionPanel ? 2 : 1);
  const activeImageIndex = (slideIndex: number) => {
    if (slideIndex <= 1 || (hasDescriptionPanel && slideIndex === 2)) return 0;
    return Math.max(0, slideIndex - (hasDescriptionPanel ? 2 : 1));
  };

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const imageIndex = compact ? activeImageIndex(swiper.activeIndex) : swiper.activeIndex;
    setCurrentIndex(imageIndex);
    setAtStart(swiper.isBeginning);
    setAtEnd(swiper.isEnd);
    onSlideChange?.(imageIndex);
  }, [compact, hasDescriptionPanel, images.length, onSlideChange]);

  const updateImageSize = (img: HTMLImageElement) => {
    if (!img.naturalHeight) return;
    img.closest<HTMLElement>(".swiper-slide")?.style.setProperty("--project-image-ratio", String(img.naturalWidth / img.naturalHeight));
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      // An image finishing its download must not snap a freely panned ribbon
      // back to a slide boundary.
      const translate = swiper.translate;
      swiper.update();
      swiper.setTranslate(translate);
      swiper.updateProgress();
      swiper.updateSlidesClasses();
    }
  };

  const openImage = (image: ProjectImage, event: React.MouseEvent<HTMLButtonElement>) => {
    // Keyboard activation has detail=0 and remains available after panning.
    if (draggedRef.current && event.detail !== 0) return;
    imageTriggerRef.current = event.currentTarget;
    setZoomImage(image);
    setScale(1);
    setPosition({ x: 50, y: 50 });
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
      <section aria-label={`${initialSlide.title} gallery`} aria-roledescription="carousel" className={`relative w-full h-full flex flex-col ${compact ? "project-carousel-compact" : ""}`}>
        <div className="project-carousel-controls flex shrink-0 items-center justify-center gap-4 px-4 pb-3">
          <Button type="button" variant="outline" disabled={atStart}
            aria-label={`Previous image in ${initialSlide.title}`}
            onClick={() => {
              if (!swiperRef.current) return;
              if (!compact) swiperRef.current.slidePrev();
              else swiperRef.current.slideTo(currentIndex > 0 ? imageSlideIndex(currentIndex - 1) : 0, reducedMotion ? 0 : 260);
            }}>
            Previous
          </Button>
          <p className="text-sm" role="status" aria-live="polite" aria-atomic="true">
            Image {currentIndex + 1} of {images.length}
          </p>
          <Button type="button" variant="outline" disabled={atEnd}
            aria-label={`Next image in ${initialSlide.title}`}
            onClick={() => {
              if (!swiperRef.current) return;
              if (!compact) swiperRef.current.slideNext();
              else if (currentIndex < images.length - 1) swiperRef.current.slideTo(imageSlideIndex(currentIndex + 1), reducedMotion ? 0 : 260);
            }}>
            Next
          </Button>
        </div>
        <Swiper
          speed={reducedMotion ? 0 : 260}
          modules={[Navigation, Scrollbar, FreeMode, A11y, Mousewheel]}
          slidesPerView="auto"
          spaceBetween={compact ? 14 : -1}
          centeredSlides={false}
          scrollbar={false}
          navigation={false}
          className="w-full flex-1 min-h-0 project-carousel"
          onSlideChange={handleSlideChange}
          onProgress={(swiper) => {
            const imageIndex = compact ? activeImageIndex(swiper.activeIndex) : swiper.activeIndex;
            setAtStart(imageIndex === 0);
            setAtEnd(imageIndex >= images.length - 1);
          }}
          onResize={handleSlideChange}
          initialSlide={Math.min(compact ? (initialIndex === 0 ? 0 : imageSlideIndex(initialIndex)) : initialIndex, compact ? images.length + Number(hasDescriptionPanel) : images.length - 1)}
          allowTouchMove={true}
          onTouchStart={() => { draggedRef.current = false; }}
          onSliderFirstMove={() => { draggedRef.current = true; }}
          simulateTouch={true}
          mousewheel={compact ? { forceToAxis: true, releaseOnEdges: true, sensitivity: 0.75 } : false}
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
              slidesPerView: compact ? "auto" : 1,
              spaceBetween: compact ? 10 : 0
            },
            768: {
              slidesPerView: "auto",
              spaceBetween: compact ? 14 : 0
            },
            1024: {
              slidesPerView: "auto",
              spaceBetween: compact ? 14 : 0
            }
          }}
        >
          {/* First slide with text */}
          {compact ? <>
            <SwiperSlide key="project-facts" className="project-ribbon-panel-slide project-ribbon-panel-slide--facts h-full" role="group" aria-roledescription="slide" aria-label={`${initialSlide.title} project facts`}>
              <div className="project-ribbon-panel">{leadingPanel}</div>
            </SwiperSlide>
            <SwiperSlide key={`image-0-${images[0].src}`} className="project-ribbon-slide h-full" role="group" aria-roledescription="slide" aria-label={`Image 1 of ${images.length}`}>
              <button type="button" className="project-carousel-image project-image-open relative flex items-center justify-center h-full" aria-label={`Open image 1 of ${initialSlide.title} full screen`} onClick={(event) => openImage(images[0], event)}>
                <img src={images[0].src} alt={images[0].alt} className="project-ribbon-image h-full w-auto object-contain cursor-zoom-in" loading="eager" decoding="async"
                  onLoad={(event) => updateImageSize(event.currentTarget)} />
              </button>
            </SwiperSlide>
            {descriptionPanel && <SwiperSlide key="project-description" className="project-ribbon-panel-slide project-ribbon-panel-slide--description h-full" role="group" aria-roledescription="slide" aria-label={`${initialSlide.title} project description`}>
              <div className="project-ribbon-panel">{descriptionPanel}</div>
            </SwiperSlide>}
            {images.slice(1).map((image, index) => (
            <SwiperSlide key={`${index}-${image.src}`} className="project-ribbon-slide h-full">
              <button type="button" className="project-carousel-image project-image-open relative flex items-center justify-center h-full" aria-label={`Open image ${index + 2} of ${initialSlide.title} full screen`} onClick={(event) => openImage(image, event)}>
                <img src={image.src} alt={image.alt} className="project-ribbon-image h-full w-auto object-contain cursor-zoom-in" loading={index + 1 === initialIndex ? "eager" : "lazy"} decoding="async"
                  onLoad={(event) => updateImageSize(event.currentTarget)} />
              </button>
            </SwiperSlide>
          ))}</> : <SwiperSlide className="w-full sm:w-auto sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] h-full">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-4 h-full">
              <div className="p-4 md:p-8">
                <h3 className="text-xl font-semibold mb-3">{initialSlide.title}</h3>
                <p className="mt-2 text-sm text-gray-600 mb-4">{initialSlide.description}</p>
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  <span>{initialSlide.year}</span>
                  <span>{initialSlide.category}</span>
                </div>
              </div>
              <button type="button" className="relative flex items-center justify-center h-full min-h-[300px] max-h-[70vh] cursor-zoom-in" aria-label={`Open image 1 of ${initialSlide.title} full screen`} onClick={(event) => openImage(images[0], event)}>
                <img
                  src={images[0].src}
                  alt={images[0].alt}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </button>
            </div>
          </SwiperSlide>}

          {/* Rest of the slides */}
          {!compact && images.slice(1).map((image, index) => (
            <SwiperSlide
              key={index + 1}
              className="w-full sm:w-auto sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] h-full"
            >
              <button type="button" className="relative flex items-center justify-center h-full min-h-[300px] max-h-[70vh] cursor-zoom-in" aria-label={`Open image ${index + 2} of ${initialSlide.title} full screen`} onClick={(event) => openImage(image, event)}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <Dialog open={!!zoomImage} onOpenChange={resetZoom}>
        <DialogContent aria-describedby={undefined}
          onCloseAutoFocus={(event) => { event.preventDefault(); imageTriggerRef.current?.focus({ preventScroll: true }); }}
          className="project-image-fullscreen left-0 top-0 w-screen max-w-none h-[100dvh] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none sm:rounded-none border-0 bg-black p-0 shadow-none [&>button]:z-20 [&>button]:bg-white [&>button]:text-black [&>button]:p-2">
          <DialogTitle className="sr-only">{initialSlide.title} — enlarged image</DialogTitle>
          <div className="w-full h-full min-h-0 flex items-center justify-center bg-black">
            <img
              ref={imageRef}
              src={zoomImage?.src || ''}
              alt={zoomImage?.alt || ''}
              style={{
                transformOrigin: `${position.x}% ${position.y}%`,
                transform: `scale(${scale})`,
              }}
              className="w-full h-full object-contain cursor-zoom-in motion-safe:transition-transform motion-safe:duration-200"
              onDoubleClick={() => setScale(value => value === 1 ? 2.5 : 1)}
              onMouseMove={handleZoom}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}