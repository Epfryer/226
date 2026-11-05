
import { useState, useRef, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, pdfjs } from "react-pdf";
import { AlertCircle, RefreshCw } from "lucide-react";
import { asset } from "@/utils/asset";
import { isIOSDevice, getClampedDPR } from "@/utils/viewport";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import "@/viewer/flipbook.css";
import { enhanceZoom, ZoomState } from "@/viewer/enhanceZoom";
import { useReducedMotion } from "framer-motion";

// Use local PDF.js worker for better reliability and version consistency
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// PDF.js configuration with range support for streaming and enhanced quality
const pdfOptions = {
  cMapUrl: asset('pdfjs/cmaps/'),
  cMapPacked: true,
  disableAutoFetch: false,
  disableStream: false,
  disableRange: false,
  withCredentials: false,
  httpHeaders: {},
  isEvalSupported: false,
  standardFontDataUrl: asset('pdfjs/standard_fonts/'),
  wasmUrl: asset('pdfjs/wasm/'),
  useSystemFonts: false,           // Use embedded fonts for consistent rendering
  enableXfa: true                   // Enable XFA form rendering
};

interface FlipbookViewerProps {
  pdfUrl: string;
  onAspectRatioDetected?: (aspectRatio: number) => void;
}

// Updated pixel budget - conservative for iOS stability
// Clamped DPR prevents memory issues and crashes on pages 26-28
const IOS_MAX_PIXELS = 8_000_000; // ~8MP - conservative for stability
const DESKTOP_MAX_PIXELS = 16_000_000; // ~16 MP

// Compute DPR with clamped values for iOS
function getOutputScale() {
  // Clamp DPR to ≤2 on iOS to prevent memory issues
  const dpr = getClampedDPR();
  return dpr;
}

// Get max pixel budget based on platform
function getMaxPixels() {
  return isIOSDevice() ? IOS_MAX_PIXELS : DESKTOP_MAX_PIXELS;
}

// Custom page renderer with proper DPR handling and text layer
// IMPORTANT: No CSS transform scaling - re-render on resize instead
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
      await (canvas as any).__renderTask.promise.catch(() => {});
    } catch {}
  }
  abortController?.signal.throwIfAborted();

  // Build viewport at "layout scale" (not multiplied by DPR)
  const viewport = page.getViewport({ scale: baseScale, rotation });

  // Internal pixel resolution uses DPR via the render transform, not viewport scale
  const outputScale = getOutputScale();

  // Set the CSS size to layout dimensions (no transform scaling)
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  
  // IMPORTANT: Remove any CSS transform on canvas
  canvas.style.transform = 'none';

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
    
    if (isIOSDevice()) {
      console.log(`[iOS] Scaled down canvas from ${Math.floor(viewport.width * outputScale)}x${Math.floor(viewport.height * outputScale)} to ${pxW}x${pxH} to stay within ${maxPixels} pixel budget`);
    }
  }

  canvas.width = pxW;
  canvas.height = pxH;

  // Enhanced rendering quality for all devices
  canvas.style.imageRendering = "-webkit-optimize-contrast";
  
  // Create a 2D context with optimized settings for transparency and quality
  const ctx = canvas.getContext("2d", {
    alpha: true,                    // Preserve transparency - IMPORTANT for iOS
    desynchronized: true,           // Better performance
    colorSpace: "srgb" as any,      // Consistent color rendering
    willReadFrequently: false       // Optimize for writing (rendering)
  })!;
  
  // Verify context was created successfully
  if (!ctx) {
    throw new Error("Failed to get 2D context from canvas");
  }

  // Set image smoothing for better quality
  if (ctx instanceof CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  // Use transform to apply DPR — avoids duplicating scale in viewport & CSS
  const transform = actualOutputScale !== 1
    ? [actualOutputScale, 0, 0, actualOutputScale, 0, 0]
    : undefined;

  // Render with high-quality settings
  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
    transform,
    intent: "display" as any,           // Display intent for best quality
    signal: abortController?.signal,
    annotationMode: 2,                  // Enable all annotations
    enableHWA: true                     // Enable hardware acceleration
  });

  (canvas as any).__renderTask = renderTask;
  const cancel = () => renderTask.cancel();
  abortController?.signal.addEventListener("abort", cancel, { once: true });
  
  try {
    await renderTask.promise;
  } catch (err: any) {
    throw err;
  } finally {
    abortController?.signal.removeEventListener("abort", cancel);
  }
  abortController?.signal.throwIfAborted();

  // Render text layer if provided - use same viewport dimensions
  if (textLayerDiv) {
    // Clear previous text layer content
    textLayerDiv.innerHTML = '';
    
    // Set text layer dimensions to match canvas CSS dimensions exactly (no transforms)
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    
    // IMPORTANT: Remove any CSS transform on text layer
    textLayerDiv.style.transform = 'none';
    
    try {
      const textContent = await page.getTextContent({ includeMarkedContent: true });
      
      abortController?.signal.throwIfAborted();
      textLayerDiv.style.setProperty("--scale-factor", String(viewport.scale));
      {
        const textRenderTask = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        const cancelText = () => textRenderTask.cancel();
        abortController?.signal.addEventListener("abort", cancelText, { once: true });
        try { await textRenderTask.render(); }
        finally { abortController?.signal.removeEventListener("abort", cancelText); }
      }
    } catch (err) {
      console.warn('Text layer rendering failed:', err);
    }
  }
}

export function FlipbookViewer({ pdfUrl, onAspectRatioDetected }: FlipbookViewerProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  // Debug mode detection from URL
  const [debugMode, setDebugMode] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debug') === '1');
  }, []);

  // Restore page position from sessionStorage on mount
  const getStorageKey = () => `pdf-page-${pdfUrl}`;
  const readPage = () => {
    try {
      const page = Number(sessionStorage.getItem(getStorageKey()));
      return Number.isSafeInteger(page) && page > 0 ? page : 1;
    } catch { return 1; }
  };
  const savePage = (page: number) => {
    try { sessionStorage.setItem(getStorageKey(), String(page)); } catch { /* Storage may be disabled. */ }
  };

  const [currentPage, setCurrentPage] = useState(readPage);
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
  const [canvasRefsReady, setCanvasRefsReady] = useState(false);
  const bookRef = useRef<any>(null);
  const viewerSurfaceRef = useRef<HTMLDivElement>(null);
  const pageLayerRef = useRef<HTMLDivElement>(null);
  const zoomApiRef = useRef<ReturnType<typeof enhanceZoom> | null>(null);
  const zoomAnimationFrameRef = useRef<number>();
  const lastZoomRatioRef = useRef(1);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const abortControllers = useRef<Map<number, AbortController>>(new Map());
  const navigationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const canvasCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => {
    if (navigationDebounceRef.current) clearTimeout(navigationDebounceRef.current);
    abortControllers.current.forEach(controller => controller.abort());
    canvasRefs.current.forEach(canvas => {
      (canvas as any).__renderTask?.cancel();
      canvas.width = 0;
      canvas.height = 0;
    });
  }, []);

  // Debug logging for development
  useEffect(() => {
    if (debugMode) {
      console.log('FlipbookViewer Debug State:', {
        loading,
        error,
        pdfDoc: !!pdfDoc,
        totalPages,
        pageWidth,
        pageHeight,
        pdfAspectRatio,
        containerSize: containerRef.current?.getBoundingClientRect()
      });
    }
  }, [loading, error, pdfDoc, totalPages, pageWidth, pageHeight, pdfAspectRatio, debugMode]);

  // Save page position whenever it changes
  useEffect(() => {
    if (currentPage > 0) {
      savePage(currentPage);
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
    setCanvasRefsReady(false);
    setLoadingProgress(0);
    setError(null);
    setCurrentPage(readPage());
    setZoomLevel(1);
    setHasShownPortraitToast(false);
    
    // Clean up canvas refs, text layers and abort controllers
    canvasRefs.current.clear();
    textLayerRefs.current.clear();
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    
    // Clear any pending canvas check timer
    if (canvasCheckTimerRef.current) {
      clearInterval(canvasCheckTimerRef.current);
      canvasCheckTimerRef.current = null;
    }
  }, [pdfUrl]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get initial size immediately and set fallback if needed
    const getInitialSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
        return true;
      }
      
      // Set fallback dimensions immediately if container size not available
      const fallbackWidth = isMobile ? 375 : 1200;
      const fallbackHeight = isMobile ? 667 : 800;
      setContainerSize({ width: fallbackWidth, height: fallbackHeight });
      return false;
    };

    // Try to get initial size immediately
    const hasRealSize = getInitialSize();
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    
    // If we don't have real size, try again after a short delay
    if (!hasRealSize) {
      retryTimeout = setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }, 50);
      
      // Cleanup timeout if component unmounts
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Only update if size actually changed significantly
        if (Math.abs(width - containerSize.width) > 5 || Math.abs(height - containerSize.height) > 5) {
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
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      clearTimeout(retryTimeout);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (!pdfAspectRatio || !containerSize.width || !containerSize.height) return;

    // Fit the spread once; zoom transforms this layer, never an inset viewport.
    // Leave breathing room for the overlaid title/close and page/download controls.
    const availableHeight = Math.max(40, containerSize.height - 128);
    const availableWidth = Math.max(40, containerSize.width - 32);

    const containerAspectRatio = availableWidth / availableHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (pdfAspectRatio * 2 > containerAspectRatio) {
      displayWidth = availableWidth / 2;
      displayHeight = displayWidth / pdfAspectRatio;
    } else {
      displayHeight = availableHeight;
      displayWidth = displayHeight * pdfAspectRatio;
    }

    // Apply zoom level - use Math.round for more accurate dimensions
  const newWidth = Math.round(displayWidth);
  const newHeight = Math.round(displayHeight);
    
    // Only update if dimensions actually changed
    if (newWidth !== pageWidth || newHeight !== pageHeight) {
      console.log(`[PDF Dimensions] Calculated page size: ${newWidth}x${newHeight} (zoom: ${zoomLevel})`);
      setPageWidth(newWidth);
      setPageHeight(newHeight);
    }
  }, [containerSize, pdfAspectRatio, isMobile, pageWidth, pageHeight]);

  // Trigger initial render when flipbook becomes ready
  useEffect(() => {
    if (!isFlipbookReady || !pdfDoc || !pageWidth || !pageHeight) return;
    
    // Check for canvas refs periodically until they're available
    const checkCanvasRefs = () => {
      const canvasCount = canvasRefs.current.size;
      const currentCanvas = canvasRefs.current.get(currentPage);
      const hasCurrentPage = !!currentCanvas;
      
      console.log(`[PDF Init] Checking canvas refs... found ${canvasCount} canvases, current page ${currentPage} canvas: ${hasCurrentPage ? '✓' : '✗'}`);
      
      // We need at least the current page's canvas to be ready
      if (canvasCount > 0 && hasCurrentPage) {
        console.log('[PDF Init] Canvas refs are ready (including current page), triggering render');
        setCanvasRefsReady(true);
        if (canvasCheckTimerRef.current) {
          clearInterval(canvasCheckTimerRef.current);
          canvasCheckTimerRef.current = null;
        }
      } else {
        console.warn(`[PDF Init] Canvas refs not ready yet (count: ${canvasCount}, has current: ${hasCurrentPage}), will retry...`);
      }
    };
    
    // Initial check after a small delay
    const initialCheck = setTimeout(checkCanvasRefs, 50);
    
    // If not ready yet, check periodically
    if (!canvasRefsReady) {
      canvasCheckTimerRef.current = setInterval(checkCanvasRefs, 100);
    }
    
    return () => {
      clearTimeout(initialCheck);
      if (canvasCheckTimerRef.current) {
        clearInterval(canvasCheckTimerRef.current);
        canvasCheckTimerRef.current = null;
      }
    };
  }, [isFlipbookReady, pdfDoc, pageWidth, pageHeight, canvasRefsReady, currentPage]);

  // Render pages when they become visible or dimensions change
  // Virtualization: keep only current ±2 pages rendered to prevent memory issues
  useEffect(() => {
    if (!pdfDoc || !pageWidth || !pageHeight) return;
    
    // Wait for flipbook to be ready before rendering
    if (!isFlipbookReady) {
      console.log('[PDF Render] Waiting for flipbook to be ready...');
      return;
    }
    
    // Wait for canvas refs to be registered
    if (!canvasRefsReady) {
      console.log('[PDF Render] Waiting for canvas refs to be ready...');
      return;
    }

    let disposed = false;
    const controllers = new Set<AbortController>();
    const renderVisiblePages = async () => {
      // Always keep current page ±2 (5 pages) on mobile for smoother experience
      // Use ±2 for desktop as well for consistency
      const visibleRange = 2;
      let startPage = Math.max(1, currentPage - visibleRange);
      let endPage = Math.min(totalPages, currentPage + visibleRange);
      
      // On initial load (page 1-3), eagerly render the first 5 pages for better UX
      if (currentPage <= 3 && endPage < 5) {
        endPage = Math.min(5, totalPages);
        console.log(`[PDF Render] Initial load optimization: extending range to first 5 pages`);
      }
      
      console.log(`[PDF Render] Rendering pages ${startPage}-${endPage} (current: ${currentPage})`);
      
      // Clean up canvases outside the visible range to free memory
      canvasRefs.current.forEach((canvas, pageNum) => {
        if (pageNum < startPage || pageNum > endPage) {
          // Cancel any ongoing render task
          const controller = abortControllers.current.get(pageNum);
          if (controller) {
            try {
              controller.abort();
            } catch (err) {
              // Ignore abort errors
            }
            abortControllers.current.delete(pageNum);
          }
          
          // Clear the canvas to free GPU memory
          if ((canvas as any).__renderTask?.cancel) {
            try {
              (canvas as any).__renderTask.cancel();
            } catch {}
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          (canvas as any).__rendered = false;
          canvas.width = 0;
          canvas.height = 0;
        }
      });
      
      // Render visible pages
      for (let i = startPage; i <= endPage; i++) {
        if (disposed) return;
        const canvas = canvasRefs.current.get(i);
        const textLayer = textLayerRefs.current.get(i);
        if (!canvas) {
          console.log(`[PDF Render] Canvas not found for page ${i}, skipping`);
          continue;
        }

        // Skip if already rendered at current dimensions
        if ((canvas as any).__rendered && 
            canvas.style.width === `${pageWidth}px` &&
            canvas.style.height === `${pageHeight}px`) {
          console.log(`[PDF Render] Page ${i} already rendered, skipping`);
          continue;
        }

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
          console.log(`[PDF Render] Starting render for page ${i}`);
          const page = await pdfDoc.getPage(i);
          if (disposed) return;
          const controller = new AbortController();
          controllers.add(controller);
          abortControllers.current.set(i, controller);

          // Calculate base scale from page natural dimensions and display dimensions
          const viewport = page.getViewport({ scale: 1 });
          const baseScale = Math.min(
            pageWidth / viewport.width,
            pageHeight / viewport.height
          );

          await renderPage(page, baseScale, 0, canvas, textLayer, controller);
          if (disposed || controller.signal.aborted) return;
          (canvas as any).__rendered = true;
          console.log(`[PDF Render] Completed render for page ${i}`);
          
          // Cleanup page object to free memory
          if (page.cleanup) {
            page.cleanup();
          }
        } catch (err: any) {
          if (err.name !== 'AbortError' && err.name !== 'RenderingCancelledException') {
            console.error(`Error rendering page ${i}:`, err);
          }
        }
      }
    };

    renderVisiblePages();
    return () => {
      disposed = true;
      controllers.forEach(controller => controller.abort());
    };
  }, [pdfDoc, currentPage, totalPages, pageWidth, pageHeight, isFlipbookReady, canvasRefsReady]);

  const handleFlip = (e: any) => {
    setCurrentPage(e.data + 1);
  };

  // Debounced navigation for iOS to prevent overlapping renders
  const goToNextPage = useCallback(() => {
    if (!isFlipbookReady || !bookRef.current?.pageFlip) return;
    
    // Debounce on iOS to prevent rapid page changes causing crashes
    if (isIOSDevice()) {
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
      }
      navigationDebounceRef.current = setTimeout(() => {
        try {
          bookRef.current.pageFlip().flipNext();
        } catch (error) {
          console.warn("Error navigating to next page:", error);
        }
      }, 150); // 150ms debounce for iOS
    } else {
      try {
        bookRef.current.pageFlip().flipNext();
      } catch (error) {
        console.warn("Error navigating to next page:", error);
      }
    }
  }, [isFlipbookReady]);

  const goToPrevPage = useCallback(() => {
    if (!isFlipbookReady || !bookRef.current?.pageFlip) return;
    
    // Debounce on iOS to prevent rapid page changes causing crashes
    if (isIOSDevice()) {
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
      }
      navigationDebounceRef.current = setTimeout(() => {
        try {
          bookRef.current.pageFlip().flipPrev();
        } catch (error) {
          console.warn("Error navigating to previous page:", error);
        }
      }, 150); // 150ms debounce for iOS
    } else {
      try {
        bookRef.current.pageFlip().flipPrev();
      } catch (error) {
        console.warn("Error navigating to previous page:", error);
      }
    }
  }, [isFlipbookReady]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFlipbookReady || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]")) return;
      const zoom = zoomApiRef.current;
      if (event.key === "0") {
        event.preventDefault();
        zoom?.reset();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoom?.zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoom?.zoomOut();
      } else if (event.shiftKey && event.key.startsWith("Arrow")) {
        event.preventDefault();
        zoom?.panBy(
          event.key === "ArrowLeft" ? 80 : event.key === "ArrowRight" ? -80 : 0,
          event.key === "ArrowUp" ? 80 : event.key === "ArrowDown" ? -80 : 0
        );
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        zoom?.reset();
        if (event.key === "ArrowLeft") goToPrevPage();
        else goToNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipbookReady, goToNextPage, goToPrevPage]);

  useEffect(() => {
    if (!isFlipbookReady || !pageWidth || !pageHeight) return;

    const surface = viewerSurfaceRef.current;
    const pageLayer = pageLayerRef.current;
    if (!surface || !pageLayer) return;

    surface.classList.add("fv-root");
    pageLayer.classList.add("fv-pageLayer");

    const apply = (state: ZoomState) => {
      pageLayer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
      pageLayer.style.transformOrigin = "center center";
      surface.dataset.zoom = String(state.scale / state.fit);
      surface.style.cursor = state.scale > state.fit * 1.02 ? "grab" : "";

      const ratio = state.fit > 0 ? state.scale / state.fit : 1;
      if (Math.abs(ratio - lastZoomRatioRef.current) < 0.01) {
        return;
      }
      lastZoomRatioRef.current = ratio;
      if (zoomAnimationFrameRef.current) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
      }
      zoomAnimationFrameRef.current = requestAnimationFrame(() => {
        setZoomLevel(ratio);
      });
    };

    const computeFit = () => {
      const viewerRect = surface.getBoundingClientRect();
      // offset dimensions are untransformed: a resize while zoomed must not
      // treat the enlarged bounding rect as the book's natural fit size.
      if (!viewerRect.width || !viewerRect.height) {
        return 1;
      }
      const fit = Math.min(
        viewerRect.width / (pageWidth * 2),
        viewerRect.height / pageHeight,
        1
      );
      return Number.isFinite(fit) && fit > 0 ? fit : 1;
    };

    const zoomApi = enhanceZoom(surface, apply, computeFit(), {
      min: 1, max: 4, dblStep: 2,
      getContentSize: () => ({ width: pageWidth * 2, height: pageHeight }),
    });
    zoomApiRef.current = zoomApi;

    const handleResize = () => {
      const nextFit = computeFit();
      const state = zoomApi.getState();
      state.fit = nextFit;
      zoomApi.reset();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (zoomAnimationFrameRef.current) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
        zoomAnimationFrameRef.current = undefined;
      }
      zoomApi.destroy();
      surface.classList.remove("fv-root");
      pageLayer.classList.remove("fv-pageLayer");
      zoomApiRef.current = null;
      setZoomLevel(1);
      lastZoomRatioRef.current = 1;
    };
  }, [isFlipbookReady, pageWidth, pageHeight, pdfUrl]);

  const handleRetry = () => {
    setError(null);
    setLoadingProgress(0);
    setLoading(true);
    setPageWidth(null);
    setPageHeight(null);
    setPdfAspectRatio(null);
    setIsFlipbookReady(false);
    setCurrentPage(1);
    savePage(1);
    setDocumentKey(prev => prev + 1);
    canvasRefs.current.clear();
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
  };

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
    console.log(`[PDF Load] PDF loaded successfully: ${doc.numPages} pages`);
    setPdfDoc(doc);
    setTotalPages(doc.numPages);
    setLoading(false);
    setError(null);

    if (currentPage > doc.numPages) {
      setCurrentPage(doc.numPages);
      savePage(doc.numPages);
    }

    // Get first page to detect aspect ratio
    try {
      const firstPage = await doc.getPage(1);
      const { width, height } = firstPage.getViewport({ scale: 1 });
      const aspectRatio = width / height;
      console.log(`[PDF Load] Detected aspect ratio: ${aspectRatio.toFixed(2)} (${width}x${height})`);
      setPdfAspectRatio(aspectRatio);
      if (onAspectRatioDetected) {
        onAspectRatioDetected(aspectRatio);
      }

      // Force container size detection and dimension calculation immediately
      setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            console.log(`[PDF Load] Container size detected: ${rect.width}x${rect.height}`);
            setContainerSize({ width: rect.width, height: rect.height });
          } else {
            // Use fallback dimensions if container size still not available
            const fallbackWidth = isMobile ? 375 : 1200;
            const fallbackHeight = isMobile ? 667 : 800;
            console.log(`[PDF Load] Using fallback dimensions: ${fallbackWidth}x${fallbackHeight}`);
            setContainerSize({ width: fallbackWidth, height: fallbackHeight });
          }
        }
      }, 0); // Immediate but async

      // Cleanup the page to prevent memory leaks
      if (firstPage.cleanup) {
        firstPage.cleanup();
      }
    } catch (err) {
      console.error("[PDF Load] Error getting first page:", err);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="pdf-viewer-container relative flex items-center justify-center h-full w-full overflow-hidden"
      aria-describedby="reader-instructions"
    >
      {error ? (
        renderErrorState()
      ) : (
        <Document
          className="fv-document"
          key={`pdf-${documentKey}`}
          file={pdfUrl}
          options={pdfOptions}
          onLoadSuccess={handleDocumentLoad}
          onLoadProgress={({ loaded, total }) => {
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
            setLoadingProgress(progress);
            if (debugMode) {
              console.log(`PDF Loading Progress: ${progress}%`);
            }
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
            // Render flipbook as soon as we have basic requirements
            pdfDoc && totalPages > 0 && pageWidth && pageHeight && (
              <>
                {debugMode && (
                  <div className="absolute top-16 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
                    <div>PDF: {pdfDoc ? '✓' : '✗'}</div>
                    <div>Pages: {totalPages}</div>
                    <div>Size: {pageWidth}×{pageHeight}</div>
                    <div>Aspect: {pdfAspectRatio?.toFixed(2)}</div>
                    <div>Ready: {isFlipbookReady ? '✓' : '✗'}</div>
                  </div>
                )}
                <div
                  ref={viewerSurfaceRef}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    ref={pageLayerRef}
                    className="relative flex shrink-0 items-center justify-center"
                    style={{
                      width: pageWidth * 2,
                      height: pageHeight,
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
                      flippingTime={reduceMotion ? 1 : 800}
                      usePortrait={false}
                      startPage={Math.min(currentPage - 1, totalPages - 1)}
                      drawShadow={true}
                      className="shadow-2xl"
                      ref={bookRef}
                      onFlip={handleFlip}
                      onInit={() => {
                        console.log('[PDF Flipbook] Flipbook initialized');
                        console.log('[PDF Flipbook] Current state:', {
                          currentPage,
                          totalPages,
                          pageWidth,
                          pageHeight,
                          canvasRefsCount: canvasRefs.current.size
                        });
                        setIsFlipbookReady(true);
                      }}
                      onChangeState={() => {
                        if (!isFlipbookReady) {
                          console.log('[PDF Flipbook] Flipbook state changed, setting ready state');
                          setIsFlipbookReady(true);
                        }
                      }}
                      mobileScrollSupport={true}
                      style={{
                        width: pageWidth,
                        height: pageHeight,
                        transform: 'none'
                      }}
                      startZIndex={0}
                      maxShadowOpacity={0.5}
                      showPageCorners={true}
                      disableFlipByClick={true}
                      clickEventForward={true}
                      useMouseEvents={true}
                      swipeDistance={30}
                    >
                  {Array.from(new Array(totalPages), (_, index) => {
                    const pageNum = index + 1;
                    // Match the visible range in the rendering effect (±2)
                    // On initial pages (1-3), also include first 5 pages for eager loading
                    const inVisibleRange = Math.abs(pageNum - currentPage) <= 2;
                    const inInitialPages = currentPage <= 3 && pageNum <= 5;
                    const shouldRender = inVisibleRange || inInitialPages;
                    
                    return (
                      <div
                        key={`page_${pageNum}`}
                        className="pdf-page bg-white shadow-lg overflow-hidden relative"
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
                                } else canvasRefs.current.delete(pageNum);
                              }}
                              style={{
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 'auto',
                                height: '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                transform: 'none'
                              }}
                            />
                            <div
                              ref={(el) => {
                                if (el) {
                                  textLayerRefs.current.set(pageNum, el);
                                } else textLayerRefs.current.delete(pageNum);
                              }}
                              className="textLayer"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                overflow: 'clip',
                                opacity: 0.2,
                                lineHeight: 1,
                                pointerEvents: 'none',
                                mixBlendMode: 'normal',
                                transform: 'none',
                                willChange: 'auto'
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
                </div>
              </>
            )
          )}
        </Document>
      )}

      {!loading && !error && totalPages > 0 && (
        <>
          <div className="fv-position" role="status" aria-live="polite" aria-atomic="true">
            {currentPage === 1
              ? `Page 1 of ${totalPages}`
              : totalPages === 1
                ? `Page 1 of 1`
                : currentPage >= totalPages
                  ? `Page ${totalPages} of ${totalPages}`
                  : `Pages ${currentPage}-${currentPage + 1} of ${totalPages}`}
          </div>

          <p id="reader-instructions" className="sr-only">
            Drag a page corner or use Left and Right arrows to turn pages.
            Pinch, double-click or Control/Command and scroll to zoom.
            Drag to pan when zoomed. Plus and Minus zoom, Shift and arrow keys pan,
            and 0 resets the view. Escape closes the publication.
          </p>
          <button type="button" className="fv-keyboard-reset" onClick={() => zoomApiRef.current?.reset()} aria-keyshortcuts="0">
            Reset zoom
          </button>
        </>
      )}
      
      {/* Debug overlay - shows when ?debug=1 */}
      {debugMode && (
        <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md text-white p-3 rounded-lg text-xs font-mono space-y-1 max-w-xs">
          <div className="font-bold text-sm mb-2">Debug Info</div>
          <div>Page: {currentPage} / {totalPages}</div>
          <div>DPR: {getOutputScale().toFixed(2)}</div>
          <div>iOS: {isIOSDevice() ? 'Yes' : 'No'}</div>
          <div>Viewport: {containerSize.width.toFixed(0)}×{containerSize.height.toFixed(0)}</div>
          {pageWidth && pageHeight && (
            <>
              <div>Canvas CSS: {pageWidth}×{pageHeight}</div>
              <div>Zoom: {zoomLevel.toFixed(2)}x</div>
            </>
          )}
          <div>Active Canvases: {canvasRefs.current.size}</div>
          <div>Max Pixels: {(getMaxPixels() / 1_000_000).toFixed(1)}MP</div>
          <div className="pt-2 border-t border-white/20">
            <div className="text-white/70">Rendered: {Array.from(canvasRefs.current.keys()).filter(pageNum => {
              const canvas = canvasRefs.current.get(pageNum);
              return canvas && (canvas as any).__rendered;
            }).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
