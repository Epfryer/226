import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, X } from "lucide-react";
import type { Publication } from "@/data/publications";
import { FlipbookViewer } from "./FlipbookViewer";
import { asset } from "@/utils/asset";
import { trackEvent } from "@/lib/analytics";
import "../viewer/reader-shell.css";

interface PdfModalProps {
  open: boolean;
  pub?: Publication;
  onClose: () => void;
}

export function PdfModal({ open, pub, onClose }: PdfModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const prefersReducedMotion = useReducedMotion();
  const isReady = open && Boolean(pub);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isReady) return;

    const previousOverflow = document.body.style.overflow;
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElementRef.current?.isConnected) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isReady]);

  if (!pub) return null;

  const motionDuration = prefersReducedMotion ? 0 : 0.24;
  const pdfUrl = asset(pub.pdfPath);

  return (
    createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            className="reader-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionDuration, ease: "easeOut" }}
          >
            <div className="reader-shell__veil" aria-hidden="true" />

            <div
              ref={dialogRef}
              className="reader-shell__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reader-title"
              tabIndex={-1}
            >
              <h2 id="reader-title" className="reader-shell__title">
                {pub.title} <span>{pub.year}</span>
              </h2>

              <div className="reader-shell__viewer">
                <FlipbookViewer key={pub.slug} pdfUrl={pdfUrl} />
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="reader-shell__control reader-shell__close"
                aria-label="Close publication"
                title="Close publication"
              >
                <X aria-hidden="true" />
              </button>

              <a
                href={pdfUrl}
                download
                onClick={() =>
                  trackEvent("publication_download_clicked", {
                    publication: pub.slug,
                  })
                }
                className="reader-shell__control reader-shell__download"
                aria-label={`Download ${pub.title} as PDF`}
              >
                <Download aria-hidden="true" />
                <span>Download PDF</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
  );
}
