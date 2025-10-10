import { useState, useRef, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface FlipbookViewerProps {
  pdfUrl: string;
  onFullscreen?: () => void;
  onAspectRatioDetected?: (aspectRatio: number) => void;
}

export function FlipbookViewer({ pdfUrl, onFullscreen, onAspectRatioDetected }: FlipbookViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number | null>(null);
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(0);
    setNumPages(0);
    setPageWidth(null);
    setPageHeight(null);
    setIsLoading(true);
  }, [pdfUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!bookRef.current?.pageFlip) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        bookRef.current.pageFlip().flipPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        bookRef.current.pageFlip().flipNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    const controlsHeight = 80;
    const availableHeight = containerSize.height - controlsHeight;
    const availableWidth = containerSize.width - 32;

    let displayHeight = Math.min(availableHeight, 625);
    let displayWidth = displayHeight * pdfAspectRatio;

    if (displayWidth > availableWidth) {
      displayWidth = availableWidth;
      displayHeight = displayWidth / pdfAspectRatio;
    }

    setPageWidth(displayWidth);
    setPageHeight(displayHeight);
  }, [containerSize, pdfAspectRatio]);

  const handleFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const goToNextPage = () => {
    if (bookRef.current?.pageFlip) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const goToPrevPage = () => {
    if (bookRef.current?.pageFlip) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full px-4 overflow-hidden">
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setCurrentPage(0);
          if (pageWidth && pageHeight) {
            setTimeout(() => {
              bookRef.current?.pageFlip().turnToPage(0);
            }, 100);
          }
        }}
        onLoadError={(error) => {
          console.error("Error loading PDF:", error);
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }
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
              key={`${pageWidth}-${pageHeight}`}
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

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-sm font-medium px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white">
          {currentPage === 0 
            ? `Page 1 of ${numPages}` 
            : `Pages ${(currentPage - 1) * 2 + 2}-${Math.min((currentPage - 1) * 2 + 3, numPages)} of ${numPages}`
          }
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage === 0 ? (numPages <= 1) : ((currentPage - 1) * 2 + 3 >= numPages)}
          className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/20 ml-2"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-white/60 mt-2">
        Click pages to flip • Use arrow keys to navigate
      </p>
    </div>
  );
}
