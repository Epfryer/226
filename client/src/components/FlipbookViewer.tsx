import { useState, useRef, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, RefreshCw, AlertCircle, Smartphone } from "lucide-react";
import { asset } from "@/utils/asset";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useIsMobile } from "@/hooks/use-mobile";

// Use CDN for PDF.js worker for better production reliability
// This matches the installed pdfjs-dist version (5.4.296)
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
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Restore page position from sessionStorage on mount
  const getStorageKey = () => `pdf-page-${pdfUrl}`;
  const initialPage = parseInt(sessionStorage.getItem(getStorageKey()) || "1");

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Save page position whenever it changes
  useEffect(() => {
    if (currentPage > 0) {
      sessionStorage.setItem(getStorageKey(), currentPage.toString());
    }
  }, [currentPage, pdfUrl]);

  // Detect mobile device and orientation
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);
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
    setCurrentPage(1); // Reset to first page
    sessionStorage.removeItem(getStorageKey()); // Clear storage for new PDF

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

  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number | null>(null);
  const [isFlipbookReady, setIsFlipbookReady] = useState(false);
  useEffect(() => {
    if (!pdfAspectRatio || containerSize.width === 0 || containerSize.height === 0) return;

    const controlsHeight = 0; // No need for control height since they're overlaid
    const padding = isMobile ? 8 : 16;
    const availableHeight = containerSize.height - (padding * 2);
    const availableWidth = containerSize.width - (padding * 2);

    const containerAspectRatio = availableWidth / availableHeight;
    // Use larger scale factor for mobile to make book bigger
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

    setPageWidth(Math.floor(displayWidth));
    setPageHeight(Math.floor(displayHeight));
  }, [containerSize, pdfAspectRatio, isMobile]);

  const handleFlip = (e: any) => {
    // e.data is the 0-based index of the LEFT page in the current spread
    setCurrentPage(e.data + 1); // +1 to make it 1-based
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
    setCurrentPage(1); // Reset to first page
    sessionStorage.removeItem(getStorageKey()); // Clear storage for new PDF
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

  // Show rotation prompt on mobile in portrait mode
  if (isMobile && isDevicePortrait) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full px-6">
        <div className="relative mb-6">
          <Smartphone className="w-20 h-20 text-white/80 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m8-10h-4M8 12H4m15.071-7.071l-2.828 2.828M8.757 15.243l-2.828 2.828m12.142 0l-2.828-2.828M8.757 8.757L5.929 5.93"/>
            </svg>
          </div>
        </div>
        <h3 className="text-white text-xl font-semibold mb-3 text-center">
          Rotate Your Device
        </h3>
        <p className="text-white/70 text-center max-w-sm">
          For the best viewing experience, please rotate your device to landscape mode.
        </p>
        <div className="mt-8 flex items-center gap-3 text-white/50 text-sm">
          <div className="w-12 h-8 border-2 border-white/50 rounded-md flex items-center justify-center transform -rotate-90">
            <Smartphone className="w-6 h-6" />
          </div>
          <span>→</span>
          <div className="w-12 h-8 border-2 border-blue-400 rounded-md flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>
    );
  }

  const renderPage = async (pageNum: number, canvas: HTMLCanvasElement) => {
    if (!pdfDoc || renderTasksRef.current.has(pageNum)) return;

    try {
      const page = await pdfDoc.getPage(pageNum);

      // Use lower scale on mobile to reduce memory usage
      const scale = isMobile ? 1.2 : 1.5;
      const viewport = page.getViewport({ scale });

      const context = canvas.getContext('2d', {
        willReadFrequently: false,
        // Reduce memory on mobile
        alpha: false
      });
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTasksRef.current.set(pageNum, renderTask);

      await renderTask.promise;
      renderTasksRef.current.delete(pageNum);

      // Clean up page object on mobile to free memory
      if (isMobile) {
        page.cleanup();
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
      renderTasksRef.current.delete(pageNum);
    }
  };

  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
          const canvas = canvasRefs.current.get(pageNum);

          if (entry.isIntersecting && canvas) {
            renderPage(pageNum, canvas);
            setCurrentPage(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        // Reduce preload distance on mobile to save memory
        rootMargin: isMobile ? '50px' : '100px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Scroll to saved page position after a brief delay
    setTimeout(() => {
      const savedPage = parseInt(sessionStorage.getItem(getStorageKey()) || "1");
      if (savedPage > 1 && savedPage <= totalPages) {
        const pageElement = document.querySelector(`[data-page="${savedPage}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
          // If element not found, try to render the page and then scroll
          // This might happen if the DOM is not fully ready yet
          // For simplicity, we'll just reset to page 1 if not found
          setCurrentPage(1);
          sessionStorage.removeItem(getStorageKey());
        }
      }
    }, 100);

    // Clean up observer on component unmount or when dependencies change
    return () => {
      observer.disconnect();
      observerRef.current = null;
      // Cancel any ongoing render tasks when the component unmounts or PDF changes
      renderTasksRef.current.forEach(task => task.cancel());
      renderTasksRef.current.clear();
    };
  }, [pdfDoc, totalPages, isMobile, containerRef]); // Added containerRef as dependency

  const [documentKey, setDocumentKey] = useState<number>(0); // Used to force re-render of Document component
  const [isRetrying, setIsRetrying] = useState<boolean>(false); // State to manage retry UI
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for retry timeout

  return (
    <div ref={containerRef} className="relative flex items-center justify-center h-full w-full overflow-hidden">
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

          // Update current page if it's out of bounds
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
          setLoading(false); // Stop loading indicator on error

          // Auto-retry if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            autoRetry();
          } else {
            // If max retries reached, show the error state
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
                key={`${pageWidth}-${pageHeight}-${pdfUrl}-${currentPage}`} // Added currentPage to key
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
                startPage={currentPage - 1} // Use 0-based index for startPage
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
                    data-page={index + 1} // Add data-page attribute for intersection observer
                  >
                    <Page
                      pageNumber={index + 1}
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={<div>Loading Page...</div>}
                      error={<div>Error Loading Page</div>}
                      canvasRef={(ref) => {
                        if (ref) {
                          canvasRefs.current.set(index + 1, ref);
                          // Observe the page if it's the current page or nearby
                          if (observerRef.current) {
                            observerRef.current.observe(ref.parentElement!);
                          }
                        } else {
                          // Clean up ref when page is unmounted
                          canvasRefs.current.delete(index + 1);
                        }
                      }}
                    />
                  </div>
                ))}
              </HTMLFlipBook>
            </div>
          ) : (
            // Render a placeholder page to get dimensions if not yet available
            <Page
              pageNumber={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={(page) => {
                const { width, height } = page;
                const aspectRatio = width / height;
                setPdfAspectRatio(aspectRatio);
                // No need to set pageWidth/Height here, it's handled by the useEffect above
              }}
              className="opacity-0 absolute invisible" // Keep it offscreen
            />
          )
        )}
      </Document>

      {/* Controls are only shown if not in error state and PDF is loaded */}
      {!loading && !error && totalPages > 0 && (
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
      )}

      {/* Instructions are only shown if not in error state and PDF is loaded */}
      {!loading && !error && totalPages > 0 && (
        <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-white/60 text-center hidden sm:block">
          Click pages to flip • Use arrow keys to navigate
        </p>
      )}
    </div>
  );
}