import { useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';

// Ensure PDF.js worker is configured
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  visible?: boolean;
}

const MAX_CANVAS_DIMENSION = 4096;

export function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  scale,
  width,
  height,
  visible = true,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!visible || !pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Cancel any ongoing render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
      }

      setIsRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });

        // Calculate actual scale based on desired dimensions
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        const actualScale = Math.min(scaleX, scaleY) * scale;

        const scaledViewport = page.getViewport({ scale: actualScale });

        // Apply DPR for sharp rendering
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let canvasWidth = Math.floor(scaledViewport.width * dpr);
        let canvasHeight = Math.floor(scaledViewport.height * dpr);

        // Clamp to max dimension
        const maxDim = Math.max(canvasWidth, canvasHeight);
        if (maxDim > MAX_CANVAS_DIMENSION) {
          const downscale = MAX_CANVAS_DIMENSION / maxDim;
          canvasWidth = Math.floor(canvasWidth * downscale);
          canvasHeight = Math.floor(canvasHeight * downscale);
        }

        // Set canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;

        const context = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
        });

        if (!context) return;

        // Render with transform
        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        const renderTask = page.render({
          canvasContext: context,
          viewport: scaledViewport,
          transform,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setIsRendering(false);

        // Cleanup
        if (page.cleanup) {
          page.cleanup();
        }
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
        setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale, width, height, visible]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          display: visible ? 'block' : 'none',
        }}
      />
      {isRendering && visible && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999',
            fontSize: '14px',
          }}
        >
          Rendering...
        </div>
      )}
    </div>
  );
}
