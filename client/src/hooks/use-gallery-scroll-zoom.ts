import { useEffect, type RefObject } from "react";

export const GALLERY_MIN_SCALE = 0.75;

/** Zoom an expanded project gallery out toward 75% as it leaves the viewport center. */
export function useGalleryScrollZoom(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reducedQuery.matches) {
        element.style.removeProperty("--project-focus-scale");
        return;
      }
      const rect = element.getBoundingClientRect();
      const offset = Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
      // Fully zoomed out once the gallery's center is about one viewport-height from center.
      const t = Math.min(1, offset / (innerHeight * 0.9));
      const eased = t * t * (3 - 2 * t);
      element.style.setProperty("--project-focus-scale", (1 - (1 - GALLERY_MIN_SCALE) * eased).toFixed(4));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedQuery.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedQuery.removeEventListener("change", schedule);
      element.style.removeProperty("--project-focus-scale");
    };
  }, [active, ref]);
}
