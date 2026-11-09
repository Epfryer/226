import { useEffect, type RefObject } from "react";

export const GALLERY_MIN_SCALE = 0.75;

/**
 * An open gallery starts at full size. Once the visitor scrolls it well away from
 * the viewport center it settles to 75% and stays there; any click (or keyboard
 * focus) inside it zooms it smoothly back to full size.
 */
export function useGalleryScrollZoom(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const setState = (state: "up" | "down") => {
      element.dataset.focus = state;
      element.style.setProperty("--project-focus-scale", state === "down" ? String(GALLERY_MIN_SCALE) : "1");
    };
    setState("up");

    const check = () => {
      frame = 0;
      if (reducedQuery.matches || element.dataset.focus === "down") return;
      const rect = element.getBoundingClientRect();
      const offset = Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
      if (offset > innerHeight * 0.75) setState("down");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };

    // First activation only restores size; it must not also open an image or follow a control.
    const wake = (event: Event) => {
      if (element.dataset.focus !== "down") return;
      event.preventDefault();
      event.stopPropagation();
      setState("up");
    };
    const wakeOnFocus = () => { if (element.dataset.focus === "down") setState("up"); };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    element.addEventListener("click", wake, true);
    element.addEventListener("focusin", wakeOnFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      element.removeEventListener("click", wake, true);
      element.removeEventListener("focusin", wakeOnFocus);
      element.style.removeProperty("--project-focus-scale");
      delete element.dataset.focus;
    };
  }, [active, ref]);
}
