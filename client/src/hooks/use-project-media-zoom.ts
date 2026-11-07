import { useEffect, useLayoutEffect, useRef } from "react";

export const clampProjectZoom = (value: number) => Math.max(.75, Math.min(1, value));

/** Alt-wheel belongs to open artwork only. Ordinary scrolling and browser zoom do not. */
export function useProjectMediaZoom(open: boolean, zoom: number, onChange: (value: number) => void) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const current = useRef(zoom);
  const change = useRef(onChange);
  const frame = useRef(0);
  const delta = useRef(0);
  const anchor = useRef<number | null>(null);
  current.current = zoom;
  change.current = onChange;

  const update = (value: number) => {
    const next = clampProjectZoom(value);
    if (next === current.current) return;
    anchor.current = mediaRef.current?.getBoundingClientRect().top ?? null;
    current.current = next;
    change.current(next);
  };

  useLayoutEffect(() => {
    if (anchor.current === null || !mediaRef.current) return;
    const shift = mediaRef.current.getBoundingClientRect().top - anchor.current;
    anchor.current = null;
    if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: "instant" });
  }, [zoom]);

  useEffect(() => {
    const element = mediaRef.current;
    if (!open || !element) return;
    const wheel = (event: WheelEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || !event.cancelable || !event.deltaY) return;
      if (!(event.target instanceof Element) || !event.target.closest(".project-image-open")) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      const next = clampProjectZoom(current.current - (delta.current + pixels) * .0006);
      if (next === current.current && !delta.current) return;
      event.preventDefault();
      event.stopPropagation(); // Do not also pan Swiper for a handled zoom gesture.
      delta.current += pixels;
      if (!frame.current) frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const pending = delta.current;
        delta.current = 0;
        update(current.current - pending * .0006);
      });
    };
    element.addEventListener("wheel", wheel, { passive: false, capture: true });
    return () => {
      element.removeEventListener("wheel", wheel, true);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      delta.current = 0;
    };
  }, [open]);
  return { mediaRef, update };
}
