import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink } from "lucide-react";
import type { Publication } from "@/data/publications";

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

  const viewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(pub.pdfPath)}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              ref={modalRef}
              layoutId={pub.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-7xl bg-background rounded-2xl shadow-2xl overflow-hidden h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="sr-only"
                aria-label="Close modal (press ESC)"
              >
                Close
              </button>
              
              <h2 id="modal-title" className="sr-only">
                {pub.title} ({pub.year})
              </h2>

              <iframe
                src={viewerUrl}
                className="w-full h-full"
                title={`${pub.title} PDF viewer`}
                loading="lazy"
                allow="fullscreen"
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
