export type ZoomState = {
  scale: number;
  x: number;
  y: number;
  fit: number;
  min: number;
  max: number;
};

type ApplyTransform = (t: ZoomState) => void;

type ZoomOptions = {
  min: number;
  max: number;
  dblStep: number;
  getContentSize?: () => { width: number; height: number };
};

type ZoomApi = {
  reset: () => void;
  zoomIn: (center?: { x: number; y: number }) => void;
  zoomOut: (center?: { x: number; y: number }) => void;
  getState: () => ZoomState;
  restore: (snapshot: { ratio: number; x: number; y: number }, fit?: number) => void;
  panBy: (dx: number, dy: number) => void;
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
  let prevMidpoint: { x: number; y: number } | undefined;
  let blockNativeGesture = false;

  const prevTouchAction = el.style.touchAction;
  el.style.touchAction = "none";

  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const applyBounded = () => {
    const size = opts.getContentSize?.();
    const rect = el.getBoundingClientRect();
    if (state.scale <= state.fit * 1.001) {
      state.x = 0;
      state.y = 0;
    } else if (size) {
      // Every edge is reachable, with a little clearance, but the whole book
      // cannot be dragged away and lost outside the screen.
      const limitX = Math.max(0, (size.width * state.scale - rect.width) / 2) + 32;
      const limitY = Math.max(0, (size.height * state.scale - rect.height) / 2) + 64;
      state.x = clamp(state.x, -limitX, limitX);
      state.y = clamp(state.y, -limitY, limitY);
    }
    apply(state);
  };
  const reset = () => {
    state.scale = state.fit;
    state.x = 0;
    state.y = 0;
    applyBounded();
  };

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
    applyBounded();
  };

  const panBy = (dx: number, dy: number) => {
    if (state.scale <= state.fit * 1.02) return;
    state.x += dx;
    state.y += dy;
    applyBounded();
  };

  const wheelHandler = (e: WheelEvent) => {
    if ((e.target as Element).closest("button, a, input")) return;
    if (!(e.ctrlKey || e.metaKey)) {
      if (state.scale > state.fit * 1.02) {
        e.preventDefault();
        panBy(-e.deltaX, -e.deltaY);
      }
      return;
    }
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
    if (lastTouches.length === 2) {
      blockNativeGesture = true;
      lastTouches.forEach(point => el.setPointerCapture?.(point.id));
      const [a, b] = lastTouches;
      prevDistance = Math.hypot(b.x - a.x, b.y - a.y);
      prevMidpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
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
      if (prevMidpoint) panBy(cx - prevMidpoint.x, cy - prevMidpoint.y);
      zoomAt(cx, cy, state.scale * factor);
      prevDistance = distanceNow;
      prevMidpoint = { x: cx, y: cy };
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
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (lastTouches.length < 2) {
      prevDistance = undefined;
      prevMidpoint = undefined;
    }
    if (lastTouches.length === 1) {
      isDragging = true;
      dragX = lastTouches[0].x;
      dragY = lastTouches[0].y;
    }
    if (!lastTouches.length) {
      // Compatibility mouse/touchend events are dispatched after pointerup.
      queueMicrotask(() => { blockNativeGesture = false; });
    }
  };

  const pointerCancelHandler = () => {
    isDragging = false;
    lastTouches = [];
    prevDistance = undefined;
    prevMidpoint = undefined;
    blockNativeGesture = false;
  };
  const doubleClickHandler = (event: MouseEvent) => {
    if ((event.target as Element).closest("button, a, input")) return;
    event.preventDefault();
    if (state.scale > state.fit * 1.02) reset();
    else zoomAt(event.clientX, event.clientY, state.fit * opts.dblStep);
  };
  // PageFlip also listens for native mouse/touch events. While zoomed or
  // pinching, those events belong to pan/zoom rather than page turning.
  const guardPageFlip = (event: Event) => {
    if ((event.target as Element).closest("button, a, input")) return;
    // Some Firefox touch-enabled contexts emit mouse events without Pointer
    // Events. Share the same drag coordinates: when both fire, the second
    // event has a zero delta rather than applying the motion twice.
    if (event.type === "mousedown" && state.scale > state.fit * 1.02 && !isDragging) {
      const mouse = event as MouseEvent;
      isDragging = true;
      dragX = mouse.clientX;
      dragY = mouse.clientY;
    }
    const touches = (event as TouchEvent).touches;
    if (state.scale > state.fit * 1.02 || blockNativeGesture || (touches && touches.length > 1)) {
      event.stopPropagation();
      if (event.cancelable) event.preventDefault();
    }
  };
  const mouseMoveFallback = (event: MouseEvent) => {
    if (isDragging && event.buttons === 1 && state.scale > state.fit * 1.02) {
      panBy(event.clientX - dragX, event.clientY - dragY);
      dragX = event.clientX;
      dragY = event.clientY;
      event.stopPropagation();
    }
  };
  const mouseUpFallback = () => { if (!lastTouches.length) isDragging = false; };
  const guardedEvents = ["mousedown", "mousemove", "touchstart", "touchmove", "touchend"];
  guardedEvents.forEach(name => el.addEventListener(name, guardPageFlip, { capture: true, passive: false }));

  el.addEventListener("wheel", wheelHandler, { passive: false });
  el.addEventListener("pointerdown", pointerDownHandler);
  el.addEventListener("pointermove", pointerMoveHandler);
  el.addEventListener("pointerup", pointerUpHandler);
  el.addEventListener("pointercancel", pointerCancelHandler);
  el.addEventListener("dblclick", doubleClickHandler);
  window.addEventListener("mousemove", mouseMoveFallback, true);
  window.addEventListener("mouseup", mouseUpFallback, true);

  apply(state);

  return {
    reset,
    restore(snapshot, fit = state.fit) {
      state.fit = Math.max(.001, fit);
      state.scale = state.fit * clamp(snapshot.ratio, state.min, state.max);
      state.x = snapshot.x;
      state.y = snapshot.y;
      applyBounded();
    },
    panBy,
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
      el.removeEventListener("dblclick", doubleClickHandler);
      window.removeEventListener("mousemove", mouseMoveFallback, true);
      window.removeEventListener("mouseup", mouseUpFallback, true);
      el.style.touchAction = prevTouchAction;
      lastTouches = [];
      isDragging = false;
      prevDistance = undefined;
    },
  };
}
