import { ProjectCard } from "./ProjectCard";
import { useMemo } from "react";
import { chronologicalFeed } from "@/lib/project-feed-order";
import type { Project } from "@/lib/projects";
import type { Publication } from "@/data/publications";
import { PublicationFeedCard } from "./PublicationFeedCard";
import "./project-feed.css";
import "./publication-feed.css";

interface ProjectGridProps {
  projects: Project[];
  publications: Publication[];
  expandedIds: ReadonlySet<string>;
  slideIndices: Record<string, number>;
  zoomLevels: Record<string, number>;
  activePublicationSlug: string | null;
  pinnedPublicationSlug: string | null;
  publicationsLoading: boolean;
  publicationsError: boolean;
  onExpandedChange: (id: string, expanded: boolean) => void;
  onSlideChange: (id: string, index: number) => void;
  onZoomChange: (id: string, zoom: number) => void;
  onOpenPublication: (publication: Publication) => void;
  onPinPublication: () => void;
  onClosePublication: () => void;
  onRetryPublications: () => void;
  registerPublicationSlot: (slug: string, node: HTMLDivElement | null) => void;
}

export function ProjectGrid({
  projects,
  publications,
  expandedIds,
  slideIndices,
  zoomLevels,
  activePublicationSlug,
  pinnedPublicationSlug,
  publicationsLoading,
  publicationsError,
  onExpandedChange,
  onSlideChange,
  onZoomChange,
  onOpenPublication,
  onPinPublication,
  onClosePublication,
  onRetryPublications,
  registerPublicationSlot,
}: ProjectGridProps) {
  const entries = useMemo(() => chronologicalFeed(projects, publications), [projects, publications]);
  return (
    <div className="project-feed" aria-label="Project feed">
      {entries.map((entry) => entry.kind === "project" ? (
        <ProjectCard
          key={entry.item.id}
          project={entry.item}
          isExpanded={expandedIds.has(entry.item.id)}
          onExpand={onExpandedChange}
          slideIndex={slideIndices[entry.item.id] ?? 0}
          zoom={zoomLevels[entry.item.id] ?? 1}
          onZoomChange={(zoom) => onZoomChange(entry.item.id, zoom)}
          onSlideChange={(index) => onSlideChange(entry.item.id, index)}
        />
      ) : (
        <PublicationFeedCard
          key={`publication:${entry.item.slug}`}
          publication={entry.item}
          isActive={activePublicationSlug === entry.item.slug && pinnedPublicationSlug !== entry.item.slug}
          isPinned={pinnedPublicationSlug === entry.item.slug}
          onOpen={onOpenPublication}
          onPin={onPinPublication}
          onClose={onClosePublication}
          registerSlot={registerPublicationSlot}
        />
      ))}
      {publicationsLoading && (
        <div className="publication-feed-status" role="status">
          <span className="sr-only">Loading publications…</span>
          <div aria-hidden="true" className="publication-feed-skeleton" />
          <div aria-hidden="true" className="publication-feed-skeleton publication-feed-skeleton--short" />
        </div>
      )}
      {publicationsError && (
        <div className="publication-feed-status" role="alert">
          <p>Publications could not load.</p>
          <button type="button" onClick={onRetryPublications}>Try again</button>
        </div>
      )}
    </div>
  );
}
