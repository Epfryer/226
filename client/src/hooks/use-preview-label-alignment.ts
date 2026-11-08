import { useLayoutEffect, type RefObject } from "react";

// Align closed-row facts with the preview without moving or resizing its media.
export function usePreviewLabelAlignment(rowRef: RefObject<HTMLElement>, expanded: boolean) {
  useLayoutEffect(() => {
    const row = rowRef.current;
    const preview = row?.querySelector<HTMLElement>(".project-feed-preview");
    if (!row || !preview || expanded) return;

    const measure = () => {
      const left = preview.getBoundingClientRect().left - row.getBoundingClientRect().left;
      row.style.setProperty("--project-preview-left", `${left}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [rowRef, expanded]);
}
