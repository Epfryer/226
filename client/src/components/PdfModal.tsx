import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2 } from "lucide-react";
import type { Publication } from "@/data/publications";
import { asset } from "@/utils/asset";
import { GlobalWorkerOptions } from "pdfjs-dist";

// Set up PDF.js worker globally
GlobalWorkerOptions.workerSrc = asset("pdfjs/build/pdf.worker.min.mjs");

interface PdfModalProps {
  open: boolean;
  pub?: Publication;
  onClose: () => void;
}

export function PdfModal({ open, pub, onClose }: PdfModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "unset";
      
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!pub) return null;

  const viewerUrl = asset("pdfjs/web/viewer.html");
  // pub.pdfPath already has no leading slash now
  const fileUrl = asset(pub.pdfPath);
  
  // Be resilient to hosts that dislike Range requests in prod
  const hash = import.meta.env.DEV
    ? "#zoom=page-fit"
    : "#zoom=page-fit&disableRange=true";
    
  const handleFullscreen = () => {
    window.open(`${viewerUrl}?file=${encodeURIComponent(fileUrl)}${hash}`, '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full h-full flex flex-col max-w-[98vw] sm:max-w-[95vw] max-h-[98vh] sm:max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex-shrink-0">
                <h2 id="modal-title" className="text-sm sm:text-lg md:text-xl font-semibold text-white drop-shadow-lg truncate mr-2">
                  {pub.title} ({pub.year})
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-all flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src={`${viewerUrl}?file=${encodeURIComponent(fileUrl)}${hash}`}
                  loading="lazy"
                  title="PDF Viewer"
                />
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white/5 backdrop-blur-md border-t border-white/10 flex-shrink-0">
                <a
                  href={fileUrl}
                  download
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-md text-white text-sm sm:text-base rounded-full hover:bg-white/20 transition-all border border-white/20"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </a>
                <button
                  onClick={handleFullscreen}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-md text-white text-sm sm:text-base rounded-full hover:bg-white/20 transition-all border border-white/20"
                >
                  <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                  <span className="sm:hidden">Full</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
