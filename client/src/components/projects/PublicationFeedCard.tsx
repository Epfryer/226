import { useCallback, useId, useRef } from "react";
import { usePreviewLabelAlignment } from "@/hooks/use-preview-label-alignment";
import { trackEvent } from "@/lib/analytics";
import type { Publication } from "@/data/publications";
import type { RefCallback } from "react";

interface PublicationFeedCardProps {
  publication: Publication;
  isActive: boolean;
  isPinned: boolean;
  onOpen: (publication: Publication) => void;
  onPin: () => void;
  onClose: () => void;
  registerSlot: (slug: string, node: HTMLDivElement | null) => void;
}

export function PublicationFeedCard({
  publication,
  isActive,
  isPinned,
  onOpen,
  onPin,
  onClose,
  registerSlot,
}: PublicationFeedCardProps) {
  const panelId = useId();
  const titleId = useId();
  const rowRef = useRef<HTMLElement>(null);
  usePreviewLabelAlignment(rowRef, isActive);
  const slotRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    registerSlot(publication.slug, node);
  }, [publication.slug, registerSlot]);

  return (
    <article
      ref={rowRef}
      className={`project-feed-row publication-feed-row${isActive ? " publication-feed-row--open" : ""}`}
      data-publication-id={publication.slug}
      data-expanded={isActive}
      aria-labelledby={titleId}
    >
      <div className="project-feed-label publication-feed-label">
        {publication.coverPath && (
          <img
            className="project-feed-thumbnail"
            src={publication.coverPath}
            alt=""
            width={28}
            height={28}
            loading="lazy"
          />
        )}
        <h2 id={titleId} className="project-feed-title">
          {isActive ? (
            publication.title
          ) : (
            <button
              type="button"
              onClick={() => onOpen(publication)}
              aria-expanded={false}
              aria-controls={panelId}
              aria-label={`Open ${publication.title}`}
            >
              {publication.title}
            </button>
          )}
        </h2>
        <p className="project-feed-year">{publication.year}</p>
      </div>
      {!isActive && (
        <div className="project-feed-media publication-feed-media">
          <button
            type="button"
            className="project-feed-preview publication-feed-preview"
            onClick={() => onOpen(publication)}
            aria-expanded={false}
            aria-controls={panelId}
            aria-label={`Open ${publication.title}`}
          >
            {publication.coverPath ? (
              <img
                src={publication.coverPath}
                srcSet={publication.coverSrcSet}
                sizes={publication.coverSizes}
                width={publication.coverWidth}
                height={publication.coverHeight}
                alt={`${publication.title}, publication cover`}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span aria-hidden="true">{publication.title}</span>
            )}
          </button>
        </div>
      )}
      <div
        id={panelId}
        className="project-feed-details publication-feed-details"
        hidden={!isActive}
        role="region"
        aria-labelledby={titleId}
      >
        {isActive && (
          <>
            <div className="publication-feed-actions">
              <span>{publication.title} · {publication.year}</span>
              <div>
                <a href={publication.pdfPath} target="_blank" rel="noreferrer" onClick={() => trackEvent("publication_download_clicked", { publication: publication.slug, location: "projects_inline" })}>
                  Open PDF
                </a>
                <button type="button" onClick={onPin}>Pin reader</button>
                <button type="button" onClick={onClose} aria-label={`Close ${publication.title}`}>
                  Close
                </button>
              </div>
            </div>
            <div ref={slotRef} className="publication-feed-reader-slot" />
          </>
        )}
      </div>
      {isPinned && <p className="sr-only">{publication.title} reader is pinned.</p>}
    </article>
  );
}
