import { useEffect, type RefObject } from "react";

export const GALLERY_MIN_SCALE = 0.75;

/**
 * An open gallery starts at full size. Once the visitor scrolls it well away from
 * the viewport center it settles to 75% and stays there until the visitor clicks it.
 */
export function useGalleryScrollZoom(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    let frame = 0;
    let previousOffset = 0;
    let userScrollUntil = 0;
    let intentTimer = 0;

    const setState = (state: "up" | "down") => {
      element.dataset.focus = state;
      element.style.setProperty("--project-focus-scale", state === "down" ? String(GALLERY_MIN_SCALE) : "1");
    };
    setState("up");

    const getOffset = () => {
      const rect = element.getBoundingClientRect();
      return Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
    };
    previousOffset = getOffset();

    const markUserScroll = () => {
      userScrollUntil = performance.now() + 900;
      window.clearTimeout(intentTimer);
      intentTimer = window.setTimeout(() => { userScrollUntil = 0; }, 900);
    };
    const check = () => {
      frame = 0;
      const offset = getOffset();
      if (element.dataset.focus !== "down" && performance.now() < userScrollUntil && offset > previousOffset + 1) {
        setState("down");
      }
      previousOffset = offset;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };

    const onWheel = (event: WheelEvent) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) markUserScroll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest(".project-carousel-compact")) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) markUserScroll();
    };

    // The first click restores scale without also activating an image or control.
    const wake = (event: Event) => {
      if (element.dataset.focus !== "down") return;
      const target = event.target;
      if (target instanceof Element && target.closest(".project-feed-close, .project-feed-title button")) return;
      event.preventDefault();
      event.stopPropagation();
      setState("up");
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    window.addEventListener("touchmove", markUserScroll, { passive: true, capture: true });
    window.addEventListener("keydown", onKeyDown, true);
    element.addEventListener("click", wake, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(intentTimer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", markUserScroll, true);
      window.removeEventListener("keydown", onKeyDown, true);
      element.removeEventListener("click", wake, true);
      element.style.removeProperty("--project-focus-scale");
      delete element.dataset.focus;
    };
  }, [active, ref]);
}
