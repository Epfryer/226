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
  const bookRef = useRef<any>(null);

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
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-muted/30 to-muted/10 py-8">
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
                
                const maxHeight = 600;
                const maxPageWidth = 800;
                
                let displayHeight = maxHeight;
                let displayWidth = displayHeight * aspectRatio;
                
                if (displayWidth > maxPageWidth) {
                  displayWidth = maxPageWidth;
                  displayHeight = displayWidth / aspectRatio;
                }
                
                setPageWidth(displayWidth);
                setPageHeight(displayHeight);
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
          <div className="relative">
            <HTMLFlipBook
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

      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-sm font-medium px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md">
          {currentPage === 0 
            ? `Page 1 of ${numPages}` 
            : `Pages ${currentPage * 2}-${Math.min(currentPage * 2 + 1, numPages)} of ${numPages}`
          }
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage * 2 + 1 >= numPages}
          className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="p-3 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition-colors shadow-lg ml-2"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Click pages to flip • Use arrow keys to navigate
      </p>
    </div>
  );
}
