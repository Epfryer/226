
import { useState, useRef, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { asset } from "@/utils/asset";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

// Use CDN for PDF.js worker for better production reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

// PDF.js configuration with range support for streaming
const pdfOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
  cMapPacked: true,
  disableAutoFetch: false,
  disableStream: false,
  disableRange: false,
  httpHeaders: {},
  isEvalSupported: false,
  withCredentials: true,
};

interface FlipbookViewerProps {
  pdfUrl: string;
  onFullscreen?: () => void;
  onAspectRatioDetected?: (aspectRatio: number) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function FlipbookViewer({ pdfUrl, onFullscreen, onAspectRatioDetected }: FlipbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Restore page position from sessionStorage on mount
  const getStorageKey = () => `pdf-page-${pdfUrl}`;
  const initialPage = parseInt(sessionStorage.getItem(getStorageKey()) || "1");

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipbookReady, setIsFlipbookReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number | null>(null);
  const [documentKey, setDocumentKey] = useState<number>(0);
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasShownPortraitToast, setHasShownPortraitToast] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bookRef = useRef<any>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  // Save page position whenever it changes
  useEffect(() => {
    if (currentPage > 0) {
      sessionStorage.setItem(getStorageKey(), currentPage.toString());
    }
  }, [currentPage, pdfUrl]);

  // Detect mobile device and orientation
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsDevicePortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Show portrait rotation suggestion toast
  useEffect(() => {
    if (isMobile && isDevicePortrait && !hasShownPortraitToast) {
      toast({
        title: "Rotate for Better View",
        description: "For the best viewing experience, rotate your device to landscape mode.",
        duration: 5000,
      });
      setHasShownPortraitToast(true);
    }
  }, [isMobile, isDevicePortrait, hasShownPortraitToast, toast]);

  // Reset state when PDF URL changes
  useEffect(() => {
    console.log('PDF URL:', pdfUrl);
    setPdfDoc(null);
    setTotalPages(0);
    setPageWidth(null);
    setPageHeight(null);
    setLoading(true);
    setIsFlipbookReady(false);
    setLoadingProgress(0);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setCurrentPage(1);
    setZoomLevel(1);
    setHasShownPortraitToast(false);
    sessionStorage.removeItem(getStorageKey());

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [pdfUrl]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFlipbookReady || !bookRef.current?.pageFlip) return;

      try {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          bookRef.current.pageFlip().flipPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          bookRef.current.pageFlip().flipNext();
        }
      } catch (error) {
        console.warn("Error during keyboard navigation:", error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipbookReady]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfAspectRatio || containerSize.width === 0 || containerSize.height === 0) return;

    const padding = isMobile ? 8 : 16;
    const availableHeight = containerSize.height - (padding * 2);
    const availableWidth = containerSize.width - (padding * 2);

    const containerAspectRatio = availableWidth / availableHeight;
    const scaleFactor = isMobile ? 0.90 : 0.85;

    let displayWidth: number;
    let displayHeight: number;

    if (pdfAspectRatio > containerAspectRatio) {
      displayWidth = availableWidth * scaleFactor;
      displayHeight = displayWidth / pdfAspectRatio;
    } else {
      displayHeight = availableHeight * scaleFactor;
      displayWidth = displayHeight * pdfAspectRatio;
    }

    // Apply zoom level
    setPageWidth(Math.floor(displayWidth * zoomLevel));
    setPageHeight(Math.floor(displayHeight * zoomLevel));
  }, [containerSize, pdfAspectRatio, isMobile, zoomLevel]);

  const handleFlip = (e: any) => {
    setCurrentPage(e.data + 1);
  };

  const goToNextPage = () => {
    if (isFlipbookReady && bookRef.current?.pageFlip) {
      try {
        bookRef.current.pageFlip().flipNext();
      } catch (error) {
        console.warn("Error navigating to next page:", error);
      }
    }
  };

  const goToPrevPage = () => {
    if (isFlipbookReady && bookRef.current?.pageFlip) {
      try {
        bookRef.current.pageFlip().flipPrev();
      } catch (error) {
        console.warn("Error navigating to previous page:", error);
      }
    }
  };

  const handleRetry = () => {
    setIsRetrying(false);
    setError(null);
    setLoadingProgress(0);
    setRetryCount(0);
    setLoading(true);
    setPageWidth(null);
    setPageHeight(null);
    setPdfAspectRatio(null);
    setIsFlipbookReady(false);
    setCurrentPage(1);
    sessionStorage.removeItem(getStorageKey());
    setDocumentKey(prev => prev + 1);
  };

  const autoRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setIsRetrying(true);
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);

      console.log(`Auto-retrying PDF load (attempt ${nextRetry}/${MAX_RETRIES})...`);

      retryTimeoutRef.current = setTimeout(() => {
        setIsRetrying(false);
        setError(null);
        setLoadingProgress(0);
        setDocumentKey(prev => prev + 1);
      }, RETRY_DELAY);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Pinch-to-zoom handlers
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        pinchStartDistance.current = distance;
        // Capture current zoom level at start of pinch
        setZoomLevel(current => {
          pinchStartZoom.current = current;
          return current;
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistance.current) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = distance / pinchStartDistance.current;
        const newZoom = pinchStartZoom.current * scale;
        setZoomLevel(Math.max(0.5, Math.min(3, newZoom)));
      }
    };

    const handleTouchEnd = () => {
      pinchStartDistance.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  const renderLoadingState = () => {
    if (isRetrying) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-white text-sm font-medium">
            Retrying... (Attempt {retryCount}/{MAX_RETRIES})
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-white text-sm font-medium">
          Loading PDF... {loadingProgress}%
        </p>
        {loadingProgress > 0 && (
          <p className="text-white/60 text-xs">
            Large files may take a moment to load
          </p>
        )}
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <div className="text-center">
          <h3 className="text-white text-lg font-semibold mb-2">Failed to Load PDF</h3>
          <p className="text-white/70 text-sm mb-4">
            {error || "The PDF could not be loaded. This might be due to a network issue or the file being too large."}
          </p>
          {retryCount >= MAX_RETRIES ? (
            <p className="text-white/60 text-xs mb-4">
              Maximum retry attempts reached. Please try again later.
            </p>
          ) : (
            <p className="text-white/60 text-xs mb-4">
              {retryCount > 0 && `Retry attempt ${retryCount}/${MAX_RETRIES} failed.`}
            </p>
          )}
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  };

  const showErrorState = error && retryCount >= MAX_RETRIES;

  return (
    <div ref={containerRef} className="relative flex items-center justify-center h-full w-full overflow-hidden">
      {showErrorState ? (
        renderErrorState()
      ) : (
        <Document
          key={`pdf-${documentKey}`}
          file={pdfUrl}
          options={pdfOptions}
          onLoadSuccess={({ numPages: loadedNumPages }) => {
            console.log(`PDF loaded successfully: ${loadedNumPages} pages`);
            setTotalPages(loadedNumPages);
            setLoading(false);
            setError(null);
            setRetryCount(0);
            setIsRetrying(false);

            if (currentPage > loadedNumPages) {
              setCurrentPage(loadedNumPages);
              sessionStorage.setItem(getStorageKey(), loadedNumPages.toString());
            }
          }}
          onLoadProgress={({ loaded, total }) => {
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
            setLoadingProgress(progress);
          }}
          onLoadError={(error) => {
            console.error("Error loading PDF:", error);
            const errorMessage = error?.message || "Unknown error occurred";
            setError(errorMessage);
            setLoading(false);

            if (retryCount < MAX_RETRIES) {
              autoRetry();
            } else {
              setError(errorMessage);
            }
          }}
          loading={renderLoadingState()}
          error={renderErrorState()}
        >
          {loading ? (
            <div className="flex items-center justify-center h-96 w-full">
              {/* Loading state is handled by the `loading` prop of Document */}
            </div>
          ) : (
            pageWidth && pageHeight && totalPages > 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <HTMLFlipBook
                  key={`${pageWidth}-${pageHeight}-${pdfUrl}`}
                  width={pageWidth}
                  height={pageHeight}
                  size="fixed"
                  minWidth={pageWidth}
                  maxWidth={pageWidth}
                  minHeight={pageHeight}
                  maxHeight={pageHeight}
                  autoSize={false}
                  showCover={true}
                  flippingTime={800}
                  usePortrait={false}
                  startPage={Math.min(currentPage - 1, totalPages - 1)}
                  drawShadow={true}
                  className="shadow-2xl"
                  ref={bookRef}
                  onFlip={handleFlip}
                  onInit={() => {
                    setIsFlipbookReady(true);
                  }}
                  onChangeState={() => {
                    if (!isFlipbookReady) {
                      setIsFlipbookReady(true);
                    }
                  }}
                  mobileScrollSupport={true}
                  style={{}}
                  startZIndex={0}
                  maxShadowOpacity={0.5}
                  showPageCorners={true}
                  disableFlipByClick={false}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                >
                  {Array.from(new Array(totalPages), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="bg-white shadow-lg flex items-center justify-center"
                    >
                      <Page
                        pageNumber={index + 1}
                        width={pageWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={<div className="flex items-center justify-center h-full text-gray-400">Loading...</div>}
                        error={<div className="flex items-center justify-center h-full text-red-400">Error</div>}
                      />
                    </div>
                  ))}
                </HTMLFlipBook>
              </div>
            ) : (
              <Page
                pageNumber={1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={(page) => {
                  const { width, height } = page;
                  const aspectRatio = width / height;
                  setPdfAspectRatio(aspectRatio);
                  if (onAspectRatioDetected) {
                    onAspectRatioDetected(aspectRatio);
                  }
                }}
                className="opacity-0 absolute invisible"
              />
            )
          )}
        </Document>
      )}

      {!loading && !error && totalPages > 0 && (
        <>
          {/* Zoom controls - top right */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
              className="p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              disabled={zoomLevel === 1}
              className="p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation controls - bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="text-xs sm:text-sm font-medium px-3 sm:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white whitespace-nowrap">
                {currentPage === 1
                  ? `Page 1 of ${totalPages}`
                  : totalPages === 1
                    ? `Page 1 of 1`
                    : currentPage >= totalPages
                      ? `Page ${totalPages} of ${totalPages}`
                      : `Pages ${currentPage}-${currentPage + 1} of ${totalPages}`
                }
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-white/60 text-center hidden sm:block">
            Click pages to flip • Use arrow keys to navigate
          </p>
        </>
      )}
    </div>
  );
}
