import { useState, useCallback, useRef, useEffect } from 'react';

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface Bounds {
  width: number;
  height: number;
  containerWidth: number;
  containerHeight: number;
}

interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
  fitScale: number;
  bounds: Bounds;
  onTransformChange?: (transform: Transform) => void;
}

interface PointerState {
  pointerId: number;
  x: number;
  y: number;
}

export function useZoomPan({
  minScale = 1.0,
  maxScale = 4.0,
  fitScale,
  bounds,
  onTransformChange,
}: UseZoomPanOptions) {
  const [transform, setTransform] = useState<Transform>({
    scale: fitScale,
    x: 0,
    y: 0,
  });
  
  const pointers = useRef<Map<number, PointerState>>(new Map());
  const lastPinchDistance = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastTapTime = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Reset to fit when fitScale changes
  useEffect(() => {
    setTransform({
      scale: fitScale,
      x: 0,
      y: 0,
    });
  }, [fitScale]);

  // Clamp transform to bounds - prevents showing blank areas
  const clampTransform = useCallback(
    (t: Transform): Transform => {
      const { scale, x, y } = t;
      const { width, height, containerWidth, containerHeight } = bounds;

      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // If content is smaller than container, center it
      let clampedX = x;
      let clampedY = y;

      if (scaledWidth <= containerWidth) {
        clampedX = 0;
      } else {
        const maxX = (scaledWidth - containerWidth) / 2;
        clampedX = Math.max(-maxX, Math.min(maxX, x));
      }

      if (scaledHeight <= containerHeight) {
        clampedY = 0;
      } else {
        const maxY = (scaledHeight - containerHeight) / 2;
        clampedY = Math.max(-maxY, Math.min(maxY, y));
      }

      return { scale, x: clampedX, y: clampedY };
    },
    [bounds]
  );

  // Update transform with animation
  const updateTransform = useCallback(
    (newTransform: Transform, animate = false) => {
      const clamped = clampTransform(newTransform);
      
      if (animate && animationFrameRef.current === null) {
        const startTransform = transform;
        const startTime = performance.now();
        const duration = 250; // ms

        const animateStep = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const interpolated: Transform = {
            scale: startTransform.scale + (clamped.scale - startTransform.scale) * easeProgress,
            x: startTransform.x + (clamped.x - startTransform.x) * easeProgress,
            y: startTransform.y + (clamped.y - startTransform.y) * easeProgress,
          };

          setTransform(interpolated);
          onTransformChange?.(interpolated);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateStep);
          } else {
            animationFrameRef.current = null;
          }
        };

        animationFrameRef.current = requestAnimationFrame(animateStep);
      } else {
        setTransform(clamped);
        onTransformChange?.(clamped);
      }
    },
    [transform, clampTransform, onTransformChange]
  );

  // Zoom around a point (in screen coordinates)
  const zoomToPoint = useCallback(
    (newScale: number, screenX: number, screenY: number, animate = false) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      // Convert screen point to document coordinates
      const { containerWidth, containerHeight } = bounds;
      
      // Point relative to container center
      const dx = screenX - containerWidth / 2;
      const dy = screenY - containerHeight / 2;
      
      // Current point in document coordinates
      const docX = (dx - transform.x) / transform.scale;
      const docY = (dy - transform.y) / transform.scale;
      
      // Calculate new offset to keep the same document point under cursor
      const newX = dx - docX * clampedScale;
      const newY = dy - docY * clampedScale;

      updateTransform({ scale: clampedScale, x: newX, y: newY }, animate);
    },
    [transform, bounds, minScale, maxScale, updateTransform]
  );

  // Pan by delta
  const pan = useCallback(
    (deltaX: number, deltaY: number) => {
      updateTransform({
        scale: transform.scale,
        x: transform.x + deltaX,
        y: transform.y + deltaY,
      });
    },
    [transform, updateTransform]
  );

  // Reset to fit
  const resetToFit = useCallback(() => {
    updateTransform({ scale: fitScale, x: 0, y: 0 }, true);
  }, [fitScale, updateTransform]);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    const { containerWidth, containerHeight } = bounds;
    zoomToPoint(
      transform.scale * 1.25,
      containerWidth / 2,
      containerHeight / 2,
      true
    );
  }, [transform.scale, bounds, zoomToPoint]);

  const zoomOut = useCallback(() => {
    const { containerWidth, containerHeight } = bounds;
    zoomToPoint(
      transform.scale / 1.25,
      containerWidth / 2,
      containerHeight / 2,
      true
    );
  }, [transform.scale, bounds, zoomToPoint]);

  // Pointer event handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const pointer: PointerState = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      };
      pointers.current.set(e.pointerId, pointer);

      // Check for double-tap
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double-tap detected
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (transform.scale > fitScale + 0.05) {
          resetToFit();
        } else {
          zoomToPoint(2.0, x, y, true);
        }
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }

      if (pointers.current.size === 2) {
        // Start pinch
        const [p1, p2] = Array.from(pointers.current.values());
        const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        lastPinchDistance.current = distance;
        lastPinchCenter.current = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
      } else if (pointers.current.size === 1) {
        isDragging.current = true;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [transform, fitScale, bounds, resetToFit, zoomToPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pointer = pointers.current.get(e.pointerId);
      if (!pointer) return;

      const deltaX = e.clientX - pointer.x;
      const deltaY = e.clientY - pointer.y;

      pointer.x = e.clientX;
      pointer.y = e.clientY;

      if (pointers.current.size === 2) {
        // Handle pinch
        const [p1, p2] = Array.from(pointers.current.values());
        const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;

        if (lastPinchDistance.current && lastPinchCenter.current) {
          const scale = distance / lastPinchDistance.current;
          const newScale = transform.scale * scale;

          const rect = e.currentTarget.getBoundingClientRect();
          const x = centerX - rect.left;
          const y = centerY - rect.top;

          zoomToPoint(newScale, x, y);
        }

        lastPinchDistance.current = distance;
        lastPinchCenter.current = { x: centerX, y: centerY };
      } else if (isDragging.current && transform.scale > fitScale + 0.05) {
        // Pan only when zoomed in
        pan(deltaX, deltaY);
      }
    },
    [transform, fitScale, pan, zoomToPoint]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (pointers.current.size < 2) {
      lastPinchDistance.current = null;
      lastPinchCenter.current = null;
    }

    if (pointers.current.size === 0) {
      isDragging.current = false;
    }
  }, []);

  // Wheel handler for desktop zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const delta = -e.deltaY;
        const scaleFactor = 1 + delta / 1000;
        const newScale = transform.scale * scaleFactor;
        
        zoomToPoint(newScale, x, y);
      }
    },
    [transform.scale, zoomToPoint]
  );

  return {
    transform,
    zoomIn,
    zoomOut,
    resetToFit,
    zoomToPoint,
    pan,
    isZoomed: transform.scale > fitScale + 0.05,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onWheel: handleWheel,
    },
  };
}
