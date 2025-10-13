
import { useState, useRef, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { asset } from "@/utils/asset";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

// Use local PDF.js worker for better reliability and version consistency
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// Load TextLayer utilities from PDF.js
if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
  import('pdfjs-dist').then((pdfjsLib) => {
    (window as any).pdfjsLib = pdfjsLib;
  });
}

// PDF.js configuration with range support for streaming
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

interface FlipbookViewerProps {
  pdfUrl: string;
  onFullscreen?: () => void;
  onAspectRatioDetected?: (aspectRatio: number) => void;
}

// Helper to detect iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

// iOS-specific pixel budget (5MP limit to prevent crashes around pages 26-28)
const IOS_MAX_PIXELS = 5_000_000; // ~4K x 1200
const DESKTOP_MAX_PIXELS = 16_000_000; // ~16 MP

// Compute DPR (clamped for iOS) and a safe max pixel budget
function getOutputScale() {
  // Clamp DPR to 2 on iOS to prevent memory issues
  const dpr = Math.min(window.devicePixelRatio || 1, isIOS ? 2 : 3);
  return dpr;
}

// Get max pixel budget based on platform
function getMaxPixels() {
  return isIOS ? IOS_MAX_PIXELS : DESKTOP_MAX_PIXELS;
}

// Custom page renderer with proper DPR handling and text layer
async function renderPage(
  page: any,
  baseScale: number = 1,
  rotation: number = 0,
  canvas: HTMLCanvasElement,
  textLayerDiv?: HTMLDivElement,
  abortController?: AbortController
) {
  // Cancel any previous running task for this canvas
  if ((canvas as any).__renderTask?.cancel) {
    try {
      (canvas as any).__renderTask.cancel();
    } catch {}
  }

  // Build viewport at "layout scale" (not multiplied by DPR)
  const viewport = page.getViewport({ scale: baseScale, rotation });

  // Internal pixel resolution uses DPR via the render transform, not viewport scale
  const outputScale = getOutputScale();

  // Set the CSS size to layout dimensions (no transform scaling)
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  // Set the backing store size (pixels)
  let pxW = Math.floor(viewport.width * outputScale);
  let pxH = Math.floor(viewport.height * outputScale);

  // Prevent exceeding platform-specific canvas pixel limits
  const maxPixels = getMaxPixels();
  let actualOutputScale = outputScale;

  if (pxW * pxH > maxPixels) {
    const scaleDown = Math.sqrt(maxPixels / (pxW * pxH));
    actualOutputScale = outputScale * scaleDown;
    pxW = Math.max(1, Math.floor(viewport.width * actualOutputScale));
    pxH = Math.max(1, Math.floor(viewport.height * actualOutputScale));
    
    if (isIOS) {
      console.log(`[iOS] Scaled down canvas from ${Math.floor(viewport.width * outputScale)}x${Math.floor(viewport.height * outputScale)} to ${pxW}x${pxH} to stay within ${maxPixels} pixel budget`);
    }
  }

  canvas.width = pxW;
  canvas.height = pxH;

  // iOS-specific rendering optimization: use "auto" for better quality
  if (isIOS) {
    canvas.style.imageRendering = "auto";
  }

  // Create a 2D context with alpha:true and sRGB color space for stable transparency
  const ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
    colorSpace: "srgb" as any
  })!;
  
  // Verify context was created successfully
  if (!ctx) {
    throw new Error("Failed to get 2D context from canvas");
  }

  // Use transform to apply DPR — avoids duplicating scale in viewport & CSS
  const transform = actualOutputScale !== 1
    ? [actualOutputScale, 0, 0, actualOutputScale, 0, 0]
    : undefined;

  // Render (cancel-safe)
  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
    transform,
    intent: "display" as any,
    signal: abortController?.signal
  });

  (canvas as any).__renderTask = renderTask;
  await renderTask.promise;

  // Render text layer if provided - use same viewport dimensions
  if (textLayerDiv) {
    // Clear previous text layer content
    textLayerDiv.innerHTML = '';
    
    // Set text layer dimensions to match canvas CSS dimensions exactly (no transforms)
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    
    try {
      const textContent = await page.getTextContent({ includeMarkedContent: true });
      
      // Use PDF.js TextLayer if available
      if ((window as any).pdfjsLib?.renderTextLayer) {
        const textRenderTask = (window as any).pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        await textRenderTask.promise;
      }
    } catch (err) {
      console.warn('Text layer rendering failed:', err);
    }
  }
}

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
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number | null>(null);
  const [documentKey, setDocumentKey] = useState<number>(0);
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasShownPortraitToast, setHasShownPortraitToast] = useState(false);
  const bookRef = useRef<any>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const abortControllers = useRef<Map<number, AbortController>>(new Map());

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
    setCurrentPage(1);
    setZoomLevel(1);
    setHasShownPortraitToast(false);
    sessionStorage.removeItem(getStorageKey());
    
    // Clean up canvas refs, text layers and abort controllers
    canvasRefs.current.clear();
    textLayerRefs.current.clear();
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
  }, [pdfUrl]);

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
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Debounce resize to avoid excessive re-renders
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
          // Abort all current render tasks
          abortControllers.current.forEach(controller => {
            try {
              controller.abort();
            } catch (err) {
              // Ignore abort errors
            }
          });
          abortControllers.current.clear();

          // Clear rendered flags so pages re-render with new dimensions
          canvasRefs.current.forEach((canvas) => {
            (canvas as any).__rendered = false;
          });

          // Update container size
          setContainerSize({ width, height });
        }, 150); // 150ms debounce
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
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

    // Apply zoom level - use Math.round for more accurate dimensions
    const newWidth = Math.round(displayWidth * zoomLevel);
    const newHeight = Math.round(displayHeight * zoomLevel);
    
    setPageWidth(newWidth);
    setPageHeight(newHeight);
  }, [containerSize, pdfAspectRatio, isMobile, zoomLevel]);

  // Render pages when they become visible or dimensions change
  useEffect(() => {
    if (!pdfDoc || !pageWidth || !pageHeight) return;

    const renderVisiblePages = async () => {
      const visibleRange = 3; // Render current page +/- 3 pages
      
      for (let i = Math.max(1, currentPage - visibleRange); i <= Math.min(totalPages, currentPage + visibleRange); i++) {
        const canvas = canvasRefs.current.get(i);
        const textLayer = textLayerRefs.current.get(i);
        if (!canvas) continue;

        // Cancel existing render task for this page
        const existingController = abortControllers.current.get(i);
        if (existingController) {
          try {
            existingController.abort();
          } catch (err) {
            // Ignore abort errors
          }
        }

        try {
          const page = await pdfDoc.getPage(i);
          const controller = new AbortController();
          abortControllers.current.set(i, controller);

          // Calculate base scale from page natural dimensions and display dimensions
          const viewport = page.getViewport({ scale: 1 });
          const baseScale = Math.min(
            pageWidth / viewport.width,
            pageHeight / viewport.height
          );

          await renderPage(page, baseScale, 0, canvas, textLayer, controller);
          (canvas as any).__rendered = true;
        } catch (err: any) {
          if (err.name !== 'AbortError' && err.name !== 'RenderingCancelledException') {
            console.error(`Error rendering page ${i}:`, err);
          }
        }
      }
    };

    renderVisiblePages();
  }, [pdfDoc, currentPage, totalPages, pageWidth, pageHeight]);

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
    setError(null);
    setLoadingProgress(0);
    setLoading(true);
    setPageWidth(null);
    setPageHeight(null);
    setPdfAspectRatio(null);
    setIsFlipbookReady(false);
    setCurrentPage(1);
    sessionStorage.removeItem(getStorageKey());
    setDocumentKey(prev => prev + 1);
    canvasRefs.current.clear();
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
  };

  // Zoom functions
  const zoomIn = () => {
    // Clear rendered flags to force re-render at new zoom level
    canvasRefs.current.forEach((canvas) => {
      (canvas as any).__rendered = false;
    });
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    // Clear rendered flags to force re-render at new zoom level
    canvasRefs.current.forEach((canvas) => {
      (canvas as any).__rendered = false;
    });
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    // Clear rendered flags to force re-render at new zoom level
    canvasRefs.current.forEach((canvas) => {
      (canvas as any).__rendered = false;
    });
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

  const handleDocumentLoad = async (doc: any) => {
    console.log(`PDF loaded successfully: ${doc.numPages} pages`);
    setPdfDoc(doc);
    setTotalPages(doc.numPages);
    setLoading(false);
    setError(null);

    if (currentPage > doc.numPages) {
      setCurrentPage(doc.numPages);
      sessionStorage.setItem(getStorageKey(), doc.numPages.toString());
    }

    // Get first page to detect aspect ratio
    try {
      const firstPage = await doc.getPage(1);
      const { width, height } = firstPage.getViewport({ scale: 1 });
      const aspectRatio = width / height;
      setPdfAspectRatio(aspectRatio);
      if (onAspectRatioDetected) {
        onAspectRatioDetected(aspectRatio);
      }
    } catch (err) {
      console.error("Error getting first page:", err);
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-center h-full w-full overflow-hidden">
      {error ? (
        renderErrorState()
      ) : (
        <Document
          key={`pdf-${documentKey}`}
          file={pdfUrl}
          options={pdfOptions}
          onLoadSuccess={handleDocumentLoad}
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
          {loading ? (
            <div className="flex items-center justify-center h-96 w-full">
              {/* Loading state is handled by the `loading` prop of Document */}
            </div>
          ) : (
            pageWidth && pageHeight && totalPages > 0 && (
              <div 
                className="absolute inset-0"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
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
                  style={{
                    transform: 'none'
                  }}
                  startZIndex={0}
                  maxShadowOpacity={0.5}
                  showPageCorners={true}
                  disableFlipByClick={false}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                >
                  {Array.from(new Array(totalPages), (_, index) => {
                    const pageNum = index + 1;
                    const shouldRender = Math.abs(pageNum - currentPage) <= 3;
                    
                    return (
                      <div
                        key={`page_${pageNum}`}
                        className="bg-white shadow-lg overflow-hidden relative"
                        style={{ 
                          width: pageWidth, 
                          height: pageHeight,
                          display: 'block'
                        }}
                      >
                        {shouldRender ? (
                          <>
                            <canvas
                              ref={(el) => {
                                if (el) {
                                  canvasRefs.current.set(pageNum, el);
                                }
                              }}
                              style={{
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            />
                            <div
                              ref={(el) => {
                                if (el) {
                                  textLayerRefs.current.set(pageNum, el);
                                }
                              }}
                              className="textLayer"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                overflow: 'clip',
                                opacity: 0.2,
                                lineHeight: 1,
                                pointerEvents: 'none'
                              }}
                            />
                          </>
                        ) : (
                          <div 
                            className="text-gray-300"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}
                          >
                            Page {pageNum}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </HTMLFlipBook>
              </div>
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
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-disabled border border-white/20"
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
