import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { asset } from "@/utils/asset";
import { trackEvent } from "@/lib/analytics";
import type { Publication } from "@/data/publications";
import type { FlipbookSnapshot } from "@/components/FlipbookViewer";
import "./publication-feed.css";

const createViewer = () => lazy(() => import("@/components/FlipbookViewer").then(({ FlipbookViewer }) => ({ default: FlipbookViewer })));

class ReaderErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface PinnedPublicationReaderProps {
  publication: Publication | null;
  isPinned: boolean;
  isMinimized: boolean;
  dockSide: "left" | "right";
  host: HTMLDivElement;
  floatingSlotRef: RefObject<HTMLDivElement | null>;
  inlineSlots: RefObject<Map<string, HTMLDivElement>>;
  keeperRef: RefObject<HTMLDivElement | null>;
  onKeeperSlotChange: (node: HTMLDivElement | null) => void;
  slotVersion: number;
  snapshot?: FlipbookSnapshot;
  onSnapshotChange: (snapshot: FlipbookSnapshot) => void;
  onClose: () => void;
  onReturnInline: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onDock: (side: "left" | "right") => void;
  onFloatingSlotChange: (node: HTMLDivElement | null) => void;
}

export function PinnedPublicationReader({
  publication,
  isPinned,
  isMinimized,
  dockSide,
  host,
  floatingSlotRef,
  inlineSlots,
  keeperRef,
  onKeeperSlotChange,
  slotVersion,
  snapshot,
  onSnapshotChange,
  onClose,
  onReturnInline,
  onMinimize,
  onRestore,
  onDock,
  onFloatingSlotChange,
}: PinnedPublicationReaderProps) {
  const [Viewer, setViewer] = useState(createViewer);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [position, setPosition] = useState(() => ({
    left: typeof window === "undefined" ? 24 : Math.max(8, window.innerWidth - Math.min(780, window.innerWidth - 32) - 24),
    top: 80,
  }));
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  const setFloatingSlot = useCallback((node: HTMLDivElement | null) => {
    if (floatingSlotRef.current !== node) onFloatingSlotChange(node);
  }, [floatingSlotRef, onFloatingSlotChange]);
  const setKeeperSlot = useCallback((node: HTMLDivElement | null) => {
    if (keeperRef.current !== node) onKeeperSlotChange(node);
  }, [keeperRef, onKeeperSlotChange]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  const clampPosition = useCallback((left: number, top: number) => {
    const rect = panelRef.current?.getBoundingClientRect();
    const width = rect?.width ?? Math.min(760, window.innerWidth - 32);
    const height = rect?.height ?? Math.min(640, window.innerHeight - 32);
    return {
      left: Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8)),
      top: Math.min(Math.max(8, top), Math.max(8, window.innerHeight - height - 8)),
    };
  }, []);

  useEffect(() => {
    if (isMobile || !isPinned) return;
    const updatePosition = () => setPosition((current) => clampPosition(current.left, current.top));
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [clampPosition, isMobile, isPinned]);

  useLayoutEffect(() => {
    if (isPinned) {
      const target = floatingSlotRef.current;
      if (target && host.parentNode !== target) target.appendChild(host);
      return;
    }
    if (publication) {
      const target = inlineSlots.current?.get(publication.slug);
      if (target && host.parentNode !== target) target.appendChild(host);
      return;
    }
    const keeper = keeperRef.current;
    if (keeper && host.parentNode !== keeper) keeper.appendChild(host);
  }, [host, inlineSlots, isPinned, keeperRef, publication, slotVersion, floatingSlotRef]);

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobile || (event.target as HTMLElement).closest("button, a")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: panelRef.current?.getBoundingClientRect().left ?? position.left,
      top: panelRef.current?.getBoundingClientRect().top ?? position.top,
    };
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPosition(clampPosition(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y));
  };

  const dock = (side: "left" | "right") => {
    onDock(side);
    const width = panelRef.current?.getBoundingClientRect().width ?? Math.min(780, window.innerWidth - 32);
    const left = side === "left" ? 12 : window.innerWidth - width - 12;
    setPosition(clampPosition(left, position.top));
  };

  const portal = createPortal(
    publication ? (
      <ReaderErrorBoundary
        key={`${publication.slug}-${loadAttempt}`}
        fallback={
          <div className="publication-reader-failure" role="alert">
            <p>The reader could not load.</p>
            <a href={asset(publication.pdfPath)} target="_blank" rel="noreferrer" onClick={() => trackEvent("publication_download_clicked", { publication: publication.slug, location: "reader_error" })}>Open PDF</a>
            <button type="button" onClick={() => {
              setViewer(createViewer());
              setLoadAttempt((attempt) => attempt + 1);
            }}>Try again</button>
          </div>
        }
      >
        <Suspense fallback={<div className="publication-reader-loading" role="status">Loading publication…</div>}>
          <Viewer
            key={publication.slug}
            pdfUrl={asset(publication.pdfPath)}
            embedded
            initialState={snapshot}
            onStateChange={onSnapshotChange}
          />
        </Suspense>
      </ReaderErrorBoundary>
    ) : null,
    host,
  );

  return (
    <>
      <aside
        ref={panelRef}
        className={`publication-pinned-reader${isPinned && publication ? " is-visible" : ""}${isMinimized ? " is-minimized" : ""}${isMobile ? " is-mobile" : ""}${dockSide === "left" ? " dock-left" : " dock-right"}`}
        aria-label={publication ? `${publication.title} pinned reader` : "Pinned publication reader"}
        hidden={!isPinned || !publication}
        style={!isMobile ? { left: position.left, top: position.top } : undefined}
      >
        <div
          className="publication-reader-titlebar"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          <div className="publication-reader-title">
            <strong>{publication?.title}</strong>
            <span>{publication?.year}</span>
          </div>
          <div className="publication-reader-controls">
            <a href={publication ? asset(publication.pdfPath) : undefined} target="_blank" rel="noreferrer" onClick={() => {
              if (publication) trackEvent("publication_download_clicked", { publication: publication.slug, location: "pinned" });
            }}>PDF</a>
            <button type="button" className="publication-desktop-control" onClick={() => dock("left")} aria-label="Dock left">Left</button>
            <button type="button" className="publication-desktop-control" onClick={() => dock("right")} aria-label="Dock right">Right</button>
            <button type="button" className="publication-mobile-control" onClick={isMinimized ? onRestore : onMinimize}>
              {isMinimized ? "Restore" : "Minimize"}
            </button>
            <button type="button" onClick={onReturnInline}>Return inline</button>
            <button type="button" onClick={onClose} aria-label="Close publication reader">Close</button>
          </div>
        </div>
        <div className="publication-reader-body">
          <div
          ref={setFloatingSlot}
            className="publication-reader-host-slot"
          />
        </div>
      </aside>
      <div ref={setKeeperSlot} className="publication-reader-keeper" aria-hidden="true" />
      {portal}
    </>
  );
}
