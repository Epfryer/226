import { useState, useRef, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, RefreshCw, AlertCircle } from "lucide-react";
import { asset } from "@/utils/asset";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use asset helper to ensure correct path in production
pdfjs.GlobalWorkerOptions.workerSrc = asset('pdfjs/build/pdf.worker.mjs');

// PDF.js configuration with range support for streaming
const pdfOptions = {
  cMapUrl: asset('pdfjs/web/cmaps/'),
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
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number | null>(null);
  const [isFlipbookReady, setIsFlipbookReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [documentKey, setDocumentKey] = useState<number>(0);
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('PDF URL:', pdfUrl);
    setCurrentPage(0);
    setNumPages(0);
    setPageWidth(null);
    setPageHeight(null);
    setIsLoading(true);
    setIsFlipbookReady(false);
    setLoadingProgress(0);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    
    // Clear any pending retry timeouts
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

    const controlsHeight = 120;
    const padding = 16;
    const availableHeight = containerSize.height - controlsHeight;
    const availableWidth = containerSize.width - (padding * 2);

    const containerAspectRatio = availableWidth / availableHeight;
    const scaleFactor = 0.85;

    let displayWidth: number;
    let displayHeight: number;

    if (pdfAspectRatio > containerAspectRatio) {
      displayWidth = availableWidth * scaleFactor;
      displayHeight = displayWidth / pdfAspectRatio;
    } else {
      displayHeight = availableHeight * scaleFactor;
      displayWidth = displayHeight * pdfAspectRatio;
    }

    setPageWidth(Math.floor(displayWidth));
    setPageHeight(Math.floor(displayHeight));
  }, [containerSize, pdfAspectRatio]);

  const handleFlip = (e: any) => {
    // e.data is the 0-based index of the LEFT page in the current spread
    setCurrentPage(e.data);
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
    setIsLoading(true);
    setPageWidth(null);
    setPageHeight(null);
    setPdfAspectRatio(null);
    setIsFlipbookReady(false);
    // Force React-PDF to make a new request by changing the key
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
        // Increment documentKey to force React-PDF to retry the request
        setDocumentKey(prev => prev + 1);
      }, RETRY_DELAY);
    }
  };

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

  // Show error state if there's an error and we've exceeded retries
  if (error && retryCount >= MAX_RETRIES) {
    return renderErrorState();
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full px-2 md:px-4 overflow-hidden">
      <Document
        key={`pdf-${documentKey}`}
        file={pdfUrl}
        options={pdfOptions}
        onLoadSuccess={({ numPages }) => {
          console.log(`PDF loaded successfully: ${numPages} pages`);
          setNumPages(numPages);
          setCurrentPage(0);
          setLoadingProgress(100);
          setError(null);
          setRetryCount(0);
        }}
        onLoadProgress={({ loaded, total }) => {
          const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
          setLoadingProgress(progress);
        }}
        onLoadError={(error) => {
          console.error("Error loading PDF:", error);
          const errorMessage = error?.message || "Unknown error occurred";
          setError(errorMessage);
          setLoadingProgress(0);
          
          // Auto-retry if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            autoRetry();
          }
        }}
        loading={renderLoadingState()}
      >
        {isLoading && pageWidth === null ? (
          <div className="flex items-center justify-center h-96">
            <Page
              pageNumber={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={(page) => {
                const { width, height } = page;
                const aspectRatio = width / height;

                setPdfAspectRatio(aspectRatio);
                setIsPortrait(height > width);
                setIsLoading(false);

                if (onAspectRatioDetected) {
                  onAspectRatioDetected(aspectRatio);
                }
              }}
              className="opacity-0"
            />
          </div>
        ) : pageWidth && pageHeight ? (
          <div className="relative flex items-center justify-center">
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
              startPage={0}
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
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="bg-white shadow-lg">
                  <Page
                    pageNumber={index + 1}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        ) : null}
      </Document>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="text-xs sm:text-sm font-medium px-3 sm:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white whitespace-nowrap">
            {currentPage === 0
              ? `Page 1 of ${numPages}`
              : numPages === 1
                ? `Page 1 of 1`
                : currentPage + 1 >= numPages
                  ? `Page ${numPages} of ${numPages}`
                  : `Pages ${currentPage + 1}-${currentPage + 2} of ${numPages}`
            }
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === 0 ? (numPages <= 1) : (currentPage + 2 >= numPages)}
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

      <p className="text-xs text-white/60 mt-2 text-center hidden sm:block">
        Click pages to flip • Use arrow keys to navigate
      </p>
    </div>
  );
}