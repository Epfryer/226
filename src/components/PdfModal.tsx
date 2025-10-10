
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import type { Publication } from "@/data/publications";

interface PdfModalProps {
  open: boolean;
  pub?: Publication;
  onClose: () => void;
}

export function PdfModal({ open, pub, onClose }: PdfModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!pub) return null;

  const viewerUrl = `/pdfjs/viewer.html?file=${encodeURIComponent(pub.pdfPath)}`;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            layoutId={pub.slug}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h2 id="pdf-modal-title" className="text-xl font-semibold">
                {pub.title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewerUrl}
                className="w-full h-[80vh] md:h-[85vh]"
                loading="lazy"
                allow="fullscreen"
                title={`${pub.title} PDF viewer`}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-neutral-50">
              <div className="flex gap-3">
                <a
                  href={pub.pdfPath}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </a>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
