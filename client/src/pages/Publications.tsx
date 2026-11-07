import { Component, useState, useEffect, useLayoutEffect, useCallback, useRef, lazy, Suspense, type ReactNode } from "react";
import { PublicationCard } from "@/components/PublicationCard";
import { fetchPublications, type Publication } from "@/data/publications";
import { trackEvent } from "@/lib/analytics";
import { readPublicPageData } from "@/lib/public-page-data";
import { renderPageMetadata } from "@/lib/site-metadata";

const createPdfModal = () => lazy(() => import("@/components/PdfModal").then((module) => ({ default: module.PdfModal })));

function PdfModalFallback({ onClose, onRetry }: { onClose: () => void; onRetry?: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { document.body.style.overflow = overflow; };
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publication-viewer-status"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-6"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-5 text-white shadow-2xl">
        <div role={onRetry ? "alert" : "status"} aria-live="polite">
          <p id="publication-viewer-status" className="text-sm uppercase tracking-[0.25em] text-white/60">{onRetry ? "Viewer unavailable" : "Loading viewer"}</p>
          <p className="mt-3 text-base text-white/85">{onRetry ? "The publication viewer could not load. Please try again." : "Preparing publication…"}</p>
        </div>
        <div className="mt-5 flex gap-4">
          {onRetry && <button type="button" onClick={onRetry} className="border border-white/40 px-3 py-2 text-sm">Try again</button>}
          <button type="button" onClick={onClose} className="border border-white/40 px-3 py-2 text-sm">Close viewer</button>
        </div>
      </div>
    </div>
  );
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <PdfModalFallback onClose={this.props.onClose} onRetry={this.props.onRetry} />
      : this.props.children;
  }
}

export default function Publications() {
  const [selectedPub, setSelectedPub] = useState<Publication | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publications, setPublications] = useState<Publication[]>(() => readPublicPageData()?.publications || []);
  const [loading, setLoading] = useState(() => !readPublicPageData()?.publications);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [PdfModal, setPdfModal] = useState(createPdfModal);
  const [viewerAttempt, setViewerAttempt] = useState(0);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    // Keep the server-provided list visible while enabling the reader.
    setLoading(!readPublicPageData()?.publications);
    setLoadError(false);
    fetchPublications().then((pubs) => {
      if (!active) return;
      setPublications(pubs);
      setLoading(false);

      const params = new URLSearchParams(window.location.search);
      const docSlug = params.get("doc");

      if (docSlug) {
        const pub = pubs.find((item) => item.slug === docSlug);
        if (pub) {
          setSelectedPub(pub);
          setIsModalOpen(true);
        }
      }
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, [loadAttempt]);

  const handleOpenPub = (pub: Publication) => {
    trackEvent("publication_opened", { publication: pub.slug });
    setSelectedPub(pub);
    setIsModalOpen(true);

    const newUrl = new URL(window.location.href);
    if (newUrl.searchParams.get("doc") !== pub.slug) {
      newUrl.searchParams.set("doc", pub.slug);
      window.history.pushState({ ...window.history.state, defPublication: true }, "", newUrl);
    }
  };

  const handleClosePub = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPub(undefined);

    if (window.history.state?.defPublication && new URLSearchParams(window.location.search).has("doc")) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("doc");
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  useLayoutEffect(() => {
    if (!isModalOpen) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      handleClosePub();
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("keydown", handleEscape, true);
      // Run after the viewer's own cleanup, including when a lazy import fails.
      queueMicrotask(() => {
        if (previousFocus.current?.isConnected) previousFocus.current.focus();
      });
    };
  }, [isModalOpen, handleClosePub]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const docSlug = params.get("doc");

      const pub = publications.find((item) => item.slug === docSlug);
      setSelectedPub(pub);
      setIsModalOpen(Boolean(pub));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [publications]);

  useEffect(() => {
    document.head.querySelectorAll("[data-site-metadata]").forEach(element => element.remove());
    document.head.insertAdjacentHTML("beforeend", renderPageMetadata(
      selectedPub ? `/publications?doc=${encodeURIComponent(selectedPub.slug)}` : "/publications",
      selectedPub ? { title: `${selectedPub.title} | Ethan Fryer | D.EF`, description: `${selectedPub.title} (${selectedPub.year}), an architectural publication by Ethan Fryer. Read online or open the PDF.` } : undefined,
    ));
  }, [selectedPub]);

  return (
    <div className="container mx-auto px-4 pb-12 pt-28 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Publications</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Explore academic work, research papers, and architectural theses. The interactive viewer only loads when you open a publication.
          </p>
        </div>

        {loading ? (
          <div role="status" className="py-16">
            <span className="sr-only">Loading publications…</span>
            <div aria-hidden="true" className="flex flex-wrap gap-6 motion-safe:animate-pulse">
              <div className="h-80 w-60 bg-muted" />
              <div className="h-80 w-60 bg-muted" />
            </div>
          </div>
        ) : loadError ? (
          <div role="alert" className="py-16">
            <p className="text-lg text-muted-foreground">Publications could not load.</p>
            <button type="button" className="mt-4 border border-current px-4 py-2 text-sm" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-6 md:justify-start">
              {publications.map((pub) => (
                <div key={pub.slug}>
                  <PublicationCard pub={pub} onOpen={handleOpenPub} />
                  <a href={pub.pdfPath} className="block py-3 text-sm underline">Read {pub.title} as a PDF</a>
                </div>
              ))}
            </div>

            {publications.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground">No publications available yet. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && selectedPub && (
        <ViewerErrorBoundary
          key={viewerAttempt}
          onClose={handleClosePub}
          onRetry={() => {
            setPdfModal(() => createPdfModal());
            setViewerAttempt((attempt) => attempt + 1);
          }}
        >
          <Suspense fallback={<PdfModalFallback onClose={handleClosePub} />}>
            <PdfModal open pub={selectedPub} onClose={handleClosePub} />
          </Suspense>
        </ViewerErrorBoundary>
      )}
    </div>
  );
}
