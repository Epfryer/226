import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useToast } from "@/hooks/use-toast";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const pdfOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
  cMapPacked: true,
  disableAutoFetch: false,
  disableStream: false,
  disableRange: false,
  withCredentials: false,
  httpHeaders: {},
  isEvalSupported: false,
};

interface MobilePdfViewerProps {
  pdfUrl: string;
  onAspectRatioDetected?: (aspectRatio: number) => void;
}

export function MobilePdfViewer({ pdfUrl, onAspectRatioDetected }: MobilePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getStorageKey = () => `pdf-page-${pdfUrl}`;
  const initialPage = parseInt(sessionStorage.getItem(getStorageKey()) || "1");

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [documentKey, setDocumentKey] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);
  const [hasShownPortraitToast, setHasShownPortraitToast] = useState(false);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  useEffect(() => {
    if (currentPage > 0) {
      sessionStorage.setItem(getStorageKey(), currentPage.toString());
    }
  }, [currentPage, pdfUrl]);

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

  useEffect(() => {
    if (isDevicePortrait && !hasShownPortraitToast) {
      toast({
        title: "Rotate for Better View",
        description: "For the best viewing experience, rotate your device to landscape mode.",
        duration: 5000,
      });
      setHasShownPortraitToast(true);
    }
  }, [isDevicePortrait, hasShownPortraitToast, toast]);

  useEffect(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setPageWidth(null);
    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    setCurrentPage(1);
    setZoomLevel(1);
    setHasShownPortraitToast(false);
    sessionStorage.removeItem(getStorageKey());
  }, [pdfUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePageWidth = () => {
      const containerWidth = containerRef.current!.offsetWidth;
      const mobileScale = 0.75;
      const effectiveWidth = (containerWidth - 32) * mobileScale * zoomLevel;
      setPageWidth(Math.floor(effectiveWidth));
    };

    updatePageWidth();

    const resizeObserver = new ResizeObserver(updatePageWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [zoomLevel]);

  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoadingProgress(0);
    setLoading(true);
    setPageWidth(null);
    setCurrentPage(1);
    sessionStorage.removeItem(getStorageKey());
    setDocumentKey(prev => prev + 1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    if (!containerRef.current) return;

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
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / pinchStartDistance.current;
        const newZoom = Math.min(Math.max(pinchStartZoom.current * scale, 0.5), 3);
        setZoomLevel(newZoom);
      }
    };

    const handleTouchEnd = () => {
      pinchStartDistance.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
      <RefreshCw className="w-12 h-12 animate-spin mb-4" />
      <p className="text-lg font-medium mb-2">Loading PDF...</p>
      {loadingProgress > 0 && (
        <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}
      <p className="text-sm">{loadingProgress}%</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-full text-red-500 p-8">
      <AlertCircle className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium mb-2">Failed to Load PDF</p>
      <p className="text-sm text-gray-600 mb-4 text-center">{error}</p>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-gray-100">
      {error ? (
        renderErrorState()
      ) : (
        <>
          <Document
            key={`pdf-mobile-${documentKey}`}
            file={pdfUrl}
            options={pdfOptions}
            onLoadSuccess={({ numPages: loadedNumPages }) => {
              console.log(`PDF loaded successfully: ${loadedNumPages} pages`);
              setTotalPages(loadedNumPages);
              setLoading(false);
              setError(null);

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
            }}
            loading={renderLoadingState()}
            error={renderErrorState()}
          >
            {!loading && totalPages > 0 && pageWidth && (
              <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                <div className="bg-white shadow-lg">
                  <Page
                    pageNumber={currentPage}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="flex items-center justify-center p-12 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center p-12 text-red-400">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                    }
                    onLoadSuccess={(page) => {
                      if (currentPage === 1 && onAspectRatioDetected) {
                        const { width, height } = page;
                        const aspectRatio = width / height;
                        onAspectRatioDetected(aspectRatio);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </Document>

          {!loading && !error && totalPages > 0 && (
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={zoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center min-w-[100px]">
                    <span className="text-sm font-medium">
                      Page {currentPage} / {totalPages}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={zoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>

                  {zoomLevel !== 1 && (
                    <button
                      onClick={resetZoom}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      aria-label="Reset zoom"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
