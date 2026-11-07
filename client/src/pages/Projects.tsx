import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { PinnedPublicationReader } from "@/components/projects/PinnedPublicationReader";
import { projects } from "@/lib/projects";
import { fetchPublications, type Publication } from "@/data/publications";
import type { FlipbookSnapshot } from "@/components/FlipbookViewer";
import { trackEvent } from "@/lib/analytics";

export default function Projects() {
  const [location] = useLocation();
  const urlCategory = new URLSearchParams(location.split("?")[1]).get("category");
  const [activeCategory, setActiveCategory] = useState<string | null>(urlCategory);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({});
  const [publications, setPublications] = useState<Publication[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(true);
  const [publicationsError, setPublicationsError] = useState(false);
  const [publicationAttempt, setPublicationAttempt] = useState(0);
  const [activePublication, setActivePublication] = useState<Publication | null>(null);
  const [pinnedPublicationSlug, setPinnedPublicationSlug] = useState<string | null>(null);
  const [readerMinimized, setReaderMinimized] = useState(false);
  const [dockSide, setDockSide] = useState<"left" | "right">("right");
  const [slotVersion, setSlotVersion] = useState(0);
  const [pendingReturnSlug, setPendingReturnSlug] = useState<string | null>(null);
  const snapshots = useRef<Record<string, FlipbookSnapshot>>({});
  const inlineSlots = useRef(new Map<string, HTMLDivElement>());
  const floatingSlot = useRef<HTMLDivElement | null>(null);
  const keeper = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [readerHost] = useState(() => {
    const element = document.createElement("div");
    element.className = "publication-reader-portal";
    return element;
  });

  useEffect(() => {
    let active = true;
    setPublicationsLoading(true);
    setPublicationsError(false);
    fetchPublications().then((result) => {
      if (!active) return;
      setPublications(result);
      setPublicationsLoading(false);
    }).catch(() => {
      if (!active) return;
      setPublicationsError(true);
      setPublicationsLoading(false);
    });
    return () => { active = false; };
  }, [publicationAttempt]);

  const categories = useMemo(
    () => [...Array.from(new Set(projects.map((project) => project.category))).sort(), "Publications"],
    [],
  );

  const filteredProjects = useMemo(
    () => activeCategory && activeCategory !== "Publications"
      ? projects.filter((project) => project.category === activeCategory)
      : activeCategory === "Publications" ? [] : projects,
    [activeCategory],
  );
  const filteredPublications = useMemo(
    () => !activeCategory || activeCategory === "Publications" ? publications : [],
    [activeCategory, publications],
  );

  const registerPublicationSlot = useCallback((slug: string, node: HTMLDivElement | null) => {
    const current = inlineSlots.current.get(slug);
    if (node && current !== node) {
      inlineSlots.current.set(slug, node);
      setSlotVersion((version) => version + 1);
    } else if (!node && current) {
      inlineSlots.current.delete(slug);
      setSlotVersion((version) => version + 1);
    }
  }, []);

  const registerFloatingSlot = useCallback((node: HTMLDivElement | null) => {
    if (floatingSlot.current === node) return;
    floatingSlot.current = node;
    setSlotVersion((version) => version + 1);
  }, []);
  const registerKeeperSlot = useCallback((node: HTMLDivElement | null) => {
    keeper.current = node;
  }, []);

  useLayoutEffect(() => {
    const target = activePublication
      ? pinnedPublicationSlug === activePublication.slug
        ? floatingSlot.current
        : inlineSlots.current.get(activePublication.slug)
      : keeper.current;
    if (target && readerHost.parentNode !== target) target.appendChild(readerHost);
  }, [activePublication, pinnedPublicationSlug, readerHost, slotVersion]);

  useLayoutEffect(() => {
    if (!pendingReturnSlug || pinnedPublicationSlug) return;
    const row = Array.from(document.querySelectorAll<HTMLElement>("[data-publication-id]"))
      .find((element) => element.dataset.publicationId === pendingReturnSlug);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: reducedMotion ? "instant" : "smooth" });
    setPendingReturnSlug(null);
  }, [activeCategory, activePublication, pendingReturnSlug, pinnedPublicationSlug, reducedMotion, slotVersion]);

  const handleSnapshotChange = useCallback((snapshot: FlipbookSnapshot) => {
    if (!activePublication) return;
    snapshots.current[activePublication.slug] = snapshot;
  }, [activePublication]);

  const closePublication = useCallback(() => {
    setActivePublication(null);
    setPinnedPublicationSlug(null);
    setReaderMinimized(false);
  }, []);

  const returnInline = useCallback(() => {
    if (!activePublication) return;
    const slug = activePublication.slug;
    setPendingReturnSlug(slug);
    if (activeCategory && activeCategory !== "Publications") setActiveCategory("Publications");
    setPinnedPublicationSlug(null);
    setReaderMinimized(false);
  }, [activeCategory, activePublication]);

  return (
    <div className="project-archive">
      <div className="project-archive-heading">
        <p>Project archive</p>
        <h1>Selected works and ongoing studies.</h1>
        <p className="project-archive-intro">
          Browse the evolving body of work — academic projects, competitions, speculative proposals, and architectural studies.
        </p>
      </div>

      <div className="project-archive-filters">
        <ProjectFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={(category) => {
            setActiveCategory(category);
            trackEvent("project_category_selected", { category: category || "all" });
          }}
        />
      </div>

      <ProjectGrid
        projects={filteredProjects}
        publications={filteredPublications}
        expandedIds={expandedIds}
        slideIndices={slideIndices}
        zoomLevels={zoomLevels}
        activePublicationSlug={activePublication?.slug ?? null}
        pinnedPublicationSlug={pinnedPublicationSlug}
        publicationsLoading={publicationsLoading && activeCategory !== "Academic" && activeCategory !== "Competition"}
        publicationsError={publicationsError && activeCategory !== "Academic" && activeCategory !== "Competition"}
        onExpandedChange={(id, expanded) => {
          setExpandedIds((current) => {
            const next = new Set(current);
            if (expanded) next.add(id);
            else next.delete(id);
            return next;
          });
          trackEvent(expanded ? "project_expanded" : "project_closed", { project_id: id });
        }}
        onSlideChange={(id, index) => setSlideIndices((current) => current[id] === index ? current : { ...current, [id]: index })}
        onZoomChange={(id, zoom) => setZoomLevels((current) => current[id] === zoom ? current : { ...current, [id]: zoom })}
        onOpenPublication={(publication) => {
          setActivePublication(publication);
          setPinnedPublicationSlug((current) => current ? publication.slug : null);
          setReaderMinimized(false);
        }}
        onPinPublication={() => {
          if (!activePublication) return;
          setPinnedPublicationSlug(activePublication.slug);
          setReaderMinimized(false);
        }}
        onClosePublication={closePublication}
        onRetryPublications={() => setPublicationAttempt((attempt) => attempt + 1)}
        registerPublicationSlot={registerPublicationSlot}
      />

      <PinnedPublicationReader
        publication={activePublication}
        isPinned={Boolean(activePublication && pinnedPublicationSlug === activePublication.slug)}
        isMinimized={readerMinimized}
        dockSide={dockSide}
        host={readerHost}
        floatingSlotRef={floatingSlot}
        inlineSlots={inlineSlots}
        keeperRef={keeper}
        onKeeperSlotChange={registerKeeperSlot}
        slotVersion={slotVersion}
        snapshot={activePublication ? snapshots.current[activePublication.slug] : undefined}
        onSnapshotChange={handleSnapshotChange}
        onClose={closePublication}
        onReturnInline={returnInline}
        onMinimize={() => setReaderMinimized(true)}
        onRestore={() => setReaderMinimized(false)}
        onDock={setDockSide}
        onFloatingSlotChange={registerFloatingSlot}
      />
    </div>
  );
}
