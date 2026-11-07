import { useEffect, type RefObject } from "react";

const visible = new Set<HTMLElement>();
let observer: IntersectionObserver | undefined;
let frame = 0;
let subscribers = 0;
const schedule = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    visible.forEach(element => {
      const image = element.querySelector("img");
      if (!image) return;
      const rect = element.getBoundingClientRect();
      const distance = Math.min(1, Math.abs(rect.top + rect.height / 2 - innerHeight / 2) / (innerHeight / 2 + rect.height / 2));
      image.style.transform = reduced ? "none" : `scale(${1 - .03 * distance})`;
    });
  });
};

/** Fallback shares a single passive listener and RAF across visible previews. */
export function usePreviewScrollMotion(ref: RefObject<HTMLButtonElement>, open: boolean) {
  useEffect(() => {
    if (open || CSS.supports("animation-timeline", "view()") || !ref.current) return;
    const element = ref.current;
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target as HTMLElement) : visible.delete(entry.target as HTMLElement));
        schedule();
      });
    }
    if (!subscribers++) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", schedule);
    }
    observer.observe(element);
    return () => {
      observer?.unobserve(element);
      visible.delete(element);
      element.querySelector("img")?.style.removeProperty("transform");
      if (!--subscribers) {
        observer?.disconnect();
        observer = undefined;
        cancelAnimationFrame(frame);
        frame = 0;
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        matchMedia("(prefers-reduced-motion: reduce)").removeEventListener("change", schedule);
      }
    };
  }, [open, ref]);
}
