import { isTouchCapable } from "@/utils/isTouchCapable";

type SwipeApi = {
  destroy: () => void;
};

type GetScale = () => number;
type GetFit = () => number;
type Navigate = () => void;

const HORIZONTAL_THRESHOLD = 72;
const VERTICAL_TOLERANCE = 64;
const MAX_DURATION = 600;

export function enableSwipeNav(
  surface: HTMLElement,
  getScale: GetScale,
  getFit: GetFit,
  goPrev: Navigate,
  goNext: Navigate
): SwipeApi {
  if (!isTouchCapable()) {
    return {
      destroy: () => {
        /* noop on non-touch */
      },
    };
  }

  let trackingId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let multiTouch = false;
  const activePointers = new Set<number>();

  const reset = () => {
    trackingId = null;
    startX = 0;
    startY = 0;
    startTime = 0;
    multiTouch = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;

    activePointers.add(event.pointerId);
    if (activePointers.size > 1) {
      multiTouch = true;
      trackingId = null;
      return;
    }

    const scale = getScale();
    const fit = getFit();
    if (scale > fit * 1.05) {
      // Skip swipe navigation when user is zoomed in
      reset();
      return;
    }

    trackingId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    multiTouch = false;
    surface.setPointerCapture?.(event.pointerId);
  };

  const finishSwipe = (deltaX: number) => {
    if (Math.abs(deltaX) < HORIZONTAL_THRESHOLD) {
      return;
    }

    if (deltaX > 0) {
      goPrev();
    } else {
      goNext();
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    if (trackingId !== event.pointerId) return;

    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);

    if (dy > VERTICAL_TOLERANCE) {
      // Treat as vertical gesture – abort swipe handling
      reset();
      surface.releasePointerCapture?.(event.pointerId);
      return;
    }

    if (dx > HORIZONTAL_THRESHOLD && performance.now() - startTime < MAX_DURATION) {
      // Pre-emptively finish swipe to avoid further conflict with flipbook
      finishSwipe(event.clientX - startX);
      surface.releasePointerCapture?.(event.pointerId);
      reset();
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;

    activePointers.delete(event.pointerId);

    if (multiTouch) {
      if (activePointers.size === 0) {
        reset();
      }
      return;
    }

    if (trackingId !== event.pointerId) {
      return;
    }

    const elapsed = performance.now() - startTime;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (elapsed <= MAX_DURATION && Math.abs(deltaY) <= VERTICAL_TOLERANCE) {
      finishSwipe(deltaX);
    }

    surface.releasePointerCapture?.(event.pointerId);
    reset();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    activePointers.delete(event.pointerId);
    reset();
  };

  surface.addEventListener("pointerdown", onPointerDown, { passive: true });
  surface.addEventListener("pointermove", onPointerMove, { passive: true });
  surface.addEventListener("pointerup", onPointerUp, { passive: true });
  surface.addEventListener("pointercancel", onPointerCancel, { passive: true });

  return {
    destroy: () => {
      surface.removeEventListener("pointerdown", onPointerDown as EventListener);
      surface.removeEventListener("pointermove", onPointerMove as EventListener);
      surface.removeEventListener("pointerup", onPointerUp as EventListener);
      surface.removeEventListener("pointercancel", onPointerCancel as EventListener);
      activePointers.clear();
      reset();
    },
  };
}
