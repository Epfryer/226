import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import type { Publication } from "@/data/publications";
import { FlipbookViewer } from "./FlipbookViewer";
import { asset } from "@/utils/asset";
import { useIsMobile } from "@/hooks/use-mobile";

interface PdfModalProps {
  open: boolean;
  pub?: Publication;
  onClose: () => void;
}

export function PdfModal({ open, pub, onClose }: PdfModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [showMobileChrome, setShowMobileChrome] = useState(false);
  const autoHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setAspectRatio(null);
  }, [pub]);

  useEffect(() => {
    if (!open || !isMobile) {
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      setShowMobileChrome(false);
      return;
    }

    const reveal = () => {
      setShowMobileChrome(true);
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
      }
      autoHideTimerRef.current = window.setTimeout(() => {
        if (document.activeElement === closeButtonRef.current) {
          autoHideTimerRef.current = null;
          return;
        }
        setShowMobileChrome(false);
        autoHideTimerRef.current = null;
      }, 2200);
    };

    reveal();

    const handleActivity = () => reveal();
    const options: AddEventListenerOptions = { passive: true };
    document.addEventListener("pointerdown", handleActivity, options);
    document.addEventListener("pointermove", handleActivity, options);
    document.addEventListener("touchstart", handleActivity, options);
    document.addEventListener("touchmove", handleActivity, options);

    return () => {
      document.removeEventListener("pointerdown", handleActivity);
      document.removeEventListener("pointermove", handleActivity);
      document.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("touchmove", handleActivity);
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      setShowMobileChrome(false);
    };
  }, [open, isMobile]);

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

  const handleFullscreen = () => {
    const viewerUrl = asset('pdfjs/web/viewer.html');
    const fileUrl = asset(pub.pdfPath);
    window.open(`${viewerUrl}?file=${encodeURIComponent(fileUrl)}#zoom=page-fit`, '_blank');
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
            className="fixed inset-0 z-50 viewer-backdrop"
            onClick={onClose}
            aria-hidden="true"
            style={{
              background: 'color-mix(in srgb, #0b0b0f 55%, transparent)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          />

          <div
            className={`fixed inset-0 z-50 flex items-center justify-center ${isMobile ? "p-0" : "p-2 sm:p-4 md:p-6"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full h-full flex flex-col ${isMobile ? "" : "max-w-[98vw] sm:max-w-[95vw] max-h-[98vh] sm:max-h-[95vh]"}`}
              onClick={(e) => e.stopPropagation()}
              style={{ willChange: 'opacity' }}
            >
              {!isMobile && (
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
              )}

              <div className="flex-1 relative overflow-hidden">
                {isMobile && (
                  <>
                    <div
                      className="absolute inset-x-0 flex items-center gap-2 px-3 py-2 z-30 bg-black/45 backdrop-blur-lg rounded-3xl pdf-titlebar-mobile"
                      style={{
                        top: `calc(env(safe-area-inset-top, 0px) + 8px)`,
                        opacity: showMobileChrome ? 1 : 0,
                        pointerEvents: showMobileChrome ? "auto" : "none",
                        transition: "opacity 200ms ease",
                        paddingLeft: `calc(env(safe-area-inset-left, 0px) + 16px)`,
                        paddingRight: `calc(env(safe-area-inset-right, 0px) + 16px)`,
                      }}
                    >
                      <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white"
                        aria-label="Close viewer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex-1 text-center text-white text-sm font-medium truncate drop-shadow-lg">
                        {pub.title} ({pub.year})
                      </div>
                      <a
                        href={asset(pub.pdfPath)}
                        download
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </div>
                    
                    {/* Standalone close button for landscape mode */}
                    <button
                      onClick={onClose}
                      className="pdf-close-btn-landscape absolute z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white"
                      style={{
                        top: `calc(env(safe-area-inset-top, 0px) + 12px)`,
                        right: `calc(env(safe-area-inset-right, 0px) + 12px)`,
                        opacity: showMobileChrome ? 1 : 0,
                        transform: showMobileChrome ? 'translateY(0)' : 'translateY(-6px)',
                        pointerEvents: showMobileChrome ? "auto" : "none",
                        transition: "opacity 200ms ease, transform 200ms ease",
                      }}
                      aria-label="Close viewer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
                <FlipbookViewer 
                  pdfUrl={asset(pub.pdfPath)} 
                  onFullscreen={handleFullscreen}
                  onAspectRatioDetected={setAspectRatio}
                />

                {!isMobile && (
                  <div className="absolute top-4 right-4 z-20">
                    <a
                      href={asset(pub.pdfPath)}
                      download
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-md text-white text-sm sm:text-base rounded-full hover:bg-white/20 transition-all border border-white/20"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Download PDF</span>
                      <span className="sm:hidden">Download</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}