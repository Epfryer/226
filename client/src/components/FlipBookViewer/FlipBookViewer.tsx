import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { Download, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useZoomPan, type Bounds } from './useZoomPan';
import { usePageTurn } from './usePageTurn';
import { PdfPageCanvas } from '@/lib/pdf/PdfPageCanvas';
import './flipbook.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker - use the bundled worker from public folder
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.min.mjs';
}

interface FlipBookViewerProps {
  file: string;
  title: string;
  initialMode?: 'single' | 'spread' | 'auto';
  onClose?: () => void;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;

export function FlipBookViewer({
  file,
  title,
  initialMode = 'auto',
  onClose,
}: FlipBookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<'single' | 'spread'>('single');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if we should use spread mode
  useEffect(() => {
    if (initialMode === 'auto') {
      const shouldUseSpread = containerSize.width >= 900 && pageSize.width > 0;
      setMode(shouldUseSpread ? 'spread' : 'single');
    } else {
      setMode(initialMode);
    }
  }, [initialMode, containerSize.width, pageSize.width]);

  // Calculate fit scale based on container and page dimensions
  const fitScale = useCallback(() => {
    if (!pageSize.width || !pageSize.height || !containerSize.width || !containerSize.height) {
      return 1.0;
    }

    const padding = 16;
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;

    const displayWidth = mode === 'spread' ? pageSize.width * 2 : pageSize.width;
    const scaleX = availableWidth / displayWidth;
    const scaleY = availableHeight / pageSize.height;

    return Math.min(scaleX, scaleY, 1.0);
  }, [pageSize, containerSize, mode]);

  // Calculate bounds for zoom/pan
  const bounds: Bounds = {
    width: mode === 'spread' ? pageSize.width * 2 : pageSize.width,
    height: pageSize.height,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
  };

  // Hooks for zoom/pan and page navigation
  const {
    transform,
    zoomIn,
    zoomOut,
    resetToFit,
    isZoomed,
    handlers: zoomHandlers,
  } = useZoomPan({
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    fitScale: fitScale(),
    bounds,
  });

  const {
    currentPage,
    nextPage,
    prevPage,
    handlePageClick,
    cornerDrag,
    handleCornerDragStart,
    handleCornerDragMove,
    handleCornerDragEnd,
  } = usePageTurn({
    totalPages: numPages,
    initialPage: 0,
    isZoomed,
  });

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Load PDF and get page dimensions
  const handleDocumentLoadSuccess = useCallback(async (pdf: any) => {
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);
    setLoading(false);

    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageSize({
        width: viewport.width,
        height: viewport.height,
      });

      if (firstPage.cleanup) {
        firstPage.cleanup();
      }
    } catch (err) {
      console.error('Error loading first page:', err);
    }
  }, []);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  }, []);

  // Show controls on pointer move
  useEffect(() => {
    const handlePointerMove = () => {
      resetControlsTimer();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerMove);

    // Initial timer
    resetControlsTimer();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetToFit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomIn, zoomOut, resetToFit]);

  // Calculate which pages to render (current +/- 2)
  const visiblePageNumbers = useCallback(() => {
    const pages: number[] = [];
    const range = 2;

    for (let i = Math.max(1, currentPage + 1 - range); i <= Math.min(numPages, currentPage + 1 + range); i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, numPages]);

  const renderPages = () => {
    if (!pdfDoc || !pageSize.width) return null;

    const visiblePages = visiblePageNumbers();
    const displayPages: number[] = [];

    if (mode === 'spread') {
      // Show current and next page side by side
      displayPages.push(currentPage + 1);
      if (currentPage + 2 <= numPages) {
        displayPages.push(currentPage + 2);
      }
    } else {
      // Show single page
      displayPages.push(currentPage + 1);
    }

    return (
      <div
        className="flipbook-page-container"
        style={{
          position: 'relative',
          width: bounds.width * fitScale(),
          height: bounds.height * fitScale(),
        }}
      >
        {displayPages.map((pageNum, idx) => {
          const isVisible = visiblePages.includes(pageNum);

          return (
            <div
              key={pageNum}
              className={`flipbook-page ${
                mode === 'spread'
                  ? idx === 0
                    ? 'flipbook-page-spread-left'
                    : 'flipbook-page-spread-right'
                  : 'flipbook-page-single'
              } ${cornerDrag.isDragging && cornerDrag.corner ? 'flipbook-page-curling flipbook-page-curling-' + cornerDrag.corner : ''}`}
              style={{
                width: pageSize.width * fitScale(),
                height: pageSize.height * fitScale(),
                ...(cornerDrag.isDragging && {
                  '--curl-progress': `${100 - cornerDrag.progress * 100}%`,
                } as any),
              }}
            >
              <PdfPageCanvas
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                scale={1}
                width={pageSize.width}
                height={pageSize.height}
                visible={isVisible}
              />

              {/* Corner drag zones */}
              {!isZoomed && (
                <>
                  {idx === 0 && currentPage > 0 && (
                    <div
                      className="flipbook-corner flipbook-corner-left"
                      onPointerDown={(e) => handleCornerDragStart(e, 'left')}
                      onPointerMove={(e) => handleCornerDragMove(e, containerSize.width)}
                      onPointerUp={(e) => handleCornerDragEnd(e, containerSize.width)}
                      aria-label="Drag to previous page"
                      role="button"
                    />
                  )}
                  {((mode === 'single' && currentPage < numPages - 1) ||
                    (mode === 'spread' && idx === 1 && currentPage < numPages - 2)) && (
                    <div
                      className="flipbook-corner flipbook-corner-right"
                      onPointerDown={(e) => handleCornerDragStart(e, 'right')}
                      onPointerMove={(e) => handleCornerDragMove(e, containerSize.width)}
                      onPointerUp={(e) => handleCornerDragEnd(e, containerSize.width)}
                      aria-label="Drag to next page"
                      role="button"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flipbook-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flipbook-title"
      {...zoomHandlers}
    >
      <h2 id="flipbook-title" className="sr-only">
        {title}
      </h2>
      <div className="sr-only" role="status" aria-live="polite">
        Tap or click right side to go forward, left to go back. Pinch or ctrl+wheel to zoom.
      </div>

      <Document
        file={file}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={(error) => {
          console.error('Error loading PDF:', error);
          setError(error?.message || 'Failed to load PDF');
          setLoading(false);
        }}
        loading={
          <div className="flipbook-loading">
            <div className="flipbook-loading-spinner" />
            <div>Loading PDF...</div>
          </div>
        }
      >
        {!loading && !error && pdfDoc && (
          <div
            ref={contentRef}
            className="flipbook-content"
            style={{
              transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
            onClick={(e) => !isZoomed && handlePageClick(e, containerSize.width)}
          >
            {renderPages()}
          </div>
        )}
      </Document>

      {error && (
        <div className="flipbook-loading">
          <div style={{ color: '#ff4444', fontSize: '16px', fontWeight: 'bold' }}>
            Error loading PDF
          </div>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
      )}

      {/* Controls */}
      {!loading && !error && (
        <>
          <div className={`flipbook-controls ${!controlsVisible ? 'hidden' : ''}`}>
            <a
              href={file}
              download
              className="flipbook-controls-button"
              aria-label="Download PDF"
              title="Download PDF"
            >
              <Download size={20} />
            </a>
            <button
              className="flipbook-controls-button"
              onClick={zoomIn}
              disabled={transform.scale >= MAX_SCALE}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <ZoomIn size={20} />
            </button>
            <button
              className="flipbook-controls-button"
              onClick={zoomOut}
              disabled={transform.scale <= MIN_SCALE}
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <ZoomOut size={20} />
            </button>
            <button
              className="flipbook-controls-button"
              onClick={resetToFit}
              disabled={!isZoomed}
              aria-label="Reset to fit"
              title="Reset to fit (0)"
            >
              <RotateCcw size={20} />
            </button>
            <button
              className="flipbook-controls-button"
              onClick={() => {
                // Open in native PDF.js viewer for fullscreen
                window.open(file, '_blank');
              }}
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <Maximize2 size={20} />
            </button>
          </div>

          <div className={`flipbook-page-indicator ${!controlsVisible ? 'hidden' : ''}`}>
            {mode === 'spread' && currentPage < numPages - 1
              ? `Pages ${currentPage + 1}-${Math.min(currentPage + 2, numPages)} of ${numPages}`
              : `Page ${currentPage + 1} of ${numPages}`}
          </div>
        </>
      )}
    </div>
  );
}
