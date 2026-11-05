export type ZoomState = {
  scale: number;
  x: number;
  y: number;
  fit: number;
  min: number;
  max: number;
};

type ApplyTransform = (t: ZoomState) => void;

type ZoomOptions = { min: number; max: number; dblStep: number };

type ZoomApi = {
  reset: () => void;
  zoomIn: (center?: { x: number; y: number }) => void;
  zoomOut: (center?: { x: number; y: number }) => void;
  getState: () => ZoomState;
  destroy: () => void;
};

export function enhanceZoom(
  el: HTMLElement,
  apply: ApplyTransform,
  initialFit: number,
  opts: ZoomOptions = { min: 0.5, max: 4, dblStep: 2 }
): ZoomApi {
  const state: ZoomState = {
    scale: initialFit,
    x: 0,
    y: 0,
    fit: initialFit,
    min: opts.min,
    max: opts.max,
  };

  let lastTouches: { id: number; x: number; y: number }[] = [];
  let isDragging = false;
  let dragX = 0;
  let dragY = 0;
  let prevDistance: number | undefined;

  const prevTouchAction = el.style.touchAction;
  el.style.touchAction = "none";

  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

  const zoomAt = (cx: number, cy: number, nextScale: number) => {
    nextScale = clamp(nextScale, state.min * state.fit, state.max * state.fit);
    const prev = state.scale;
    if (nextScale === prev) return;

    const rect = el.getBoundingClientRect();
    const anchorX = cx - rect.left - rect.width / 2;
    const anchorY = cy - rect.top - rect.height / 2;
    const ox = anchorX - state.x;
    const oy = anchorY - state.y;
    const k = nextScale / prev;

    state.x = anchorX - ox * k;
    state.y = anchorY - oy * k;
    state.scale = nextScale;
    apply(state);
  };

  const panBy = (dx: number, dy: number) => {
    state.x += dx;
    state.y += dy;
    apply(state);
  };

  const wheelHandler = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    zoomAt(e.clientX, e.clientY, state.scale * factor);
  };

  const pointerDownHandler = (e: PointerEvent) => {
    if ((e.target as Element).closest("button, a, input")) return;
    if (state.scale > state.fit * 1.02) el.setPointerCapture?.(e.pointerId);
    if (e.isPrimary) {
      isDragging = true;
      dragX = e.clientX;
      dragY = e.clientY;
    }
    const t = { id: e.pointerId, x: e.clientX, y: e.clientY };
    if (!lastTouches.find((p) => p.id === t.id)) lastTouches.push(t);
  };

  const pointerMoveHandler = (e: PointerEvent) => {
    const idx = lastTouches.findIndex((p) => p.id === e.pointerId);
    if (idx >= 0) lastTouches[idx] = { id: e.pointerId, x: e.clientX, y: e.clientY };

    if (lastTouches.length === 2) {
      const [a, b] = lastTouches;
      const distanceNow = Math.hypot(b.x - a.x, b.y - a.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;

      if (prevDistance === undefined) {
        prevDistance = distanceNow;
        return;
      }

      const factor = distanceNow / (prevDistance || distanceNow || 1);
      zoomAt(cx, cy, state.scale * factor);
      prevDistance = distanceNow;
      return;
    }

    if (isDragging && state.scale > state.fit * 1.02) {
      const dx = e.clientX - dragX;
      const dy = e.clientY - dragY;
      dragX = e.clientX;
      dragY = e.clientY;
      panBy(dx, dy);
    }
  };

  const pointerUpHandler = (e: PointerEvent) => {
    isDragging = false;
    lastTouches = lastTouches.filter((p) => p.id !== e.pointerId);
    if (lastTouches.length < 2) prevDistance = undefined;
  };

  const pointerCancelHandler = () => {
    isDragging = false;
    lastTouches = [];
    prevDistance = undefined;
  };
  // PageFlip also listens for native mouse/touch events. While zoomed or
  // pinching, those events belong to pan/zoom rather than page turning.
  const guardPageFlip = (event: Event) => {
    if ((event.target as Element).closest("button, a, input")) return;
    const touches = (event as TouchEvent).touches;
    if (state.scale > state.fit * 1.02 || (touches && touches.length > 1)) {
      event.stopPropagation();
      if (event.cancelable) event.preventDefault();
    }
  };
  const guardedEvents = ["mousedown", "mousemove", "touchstart", "touchmove"];
  guardedEvents.forEach(name => el.addEventListener(name, guardPageFlip, { capture: true, passive: false }));

  el.addEventListener("wheel", wheelHandler, { passive: false });
  el.addEventListener("pointerdown", pointerDownHandler);
  el.addEventListener("pointermove", pointerMoveHandler);
  el.addEventListener("pointerup", pointerUpHandler);
  el.addEventListener("pointercancel", pointerCancelHandler);

  apply(state);

  return {
    reset() {
      state.scale = state.fit;
      state.x = 0;
      state.y = 0;
      apply(state);
    },
    zoomIn(center) {
      const rect = el.getBoundingClientRect();
      zoomAt(
        center?.x ?? rect.left + rect.width / 2,
        center?.y ?? rect.top + rect.height / 2,
        state.scale * 1.2
      );
    },
    zoomOut(center) {
      const rect = el.getBoundingClientRect();
      zoomAt(
        center?.x ?? rect.left + rect.width / 2,
        center?.y ?? rect.top + rect.height / 2,
        state.scale / 1.2
      );
    },
    getState() {
      return state;
    },
    destroy() {
      guardedEvents.forEach(name => el.removeEventListener(name, guardPageFlip, true));
      el.removeEventListener("wheel", wheelHandler as EventListener);
      el.removeEventListener("pointerdown", pointerDownHandler as EventListener);
      el.removeEventListener("pointermove", pointerMoveHandler as EventListener);
      el.removeEventListener("pointerup", pointerUpHandler as EventListener);
      el.removeEventListener("pointercancel", pointerCancelHandler as EventListener);
      el.style.touchAction = prevTouchAction;
      lastTouches = [];
      isDragging = false;
      prevDistance = undefined;
    },
  };
}
