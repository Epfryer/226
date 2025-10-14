const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [data-act]";

export function enableTapFlip(
  surface: HTMLElement,
  getScale: () => number,
  fitScale: () => number,
  onPrev: () => void,
  onNext: () => void
): { destroy: () => void } {
  let pending: number | null = null;

  const clearPending = () => {
    if (pending !== null) {
      window.clearTimeout(pending);
      pending = null;
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) return;

    // Only flip when at fit scale (<= fit + 0.05)
    if (getScale() > fitScale() + 0.05) return;

    // Ignore multi-click sequences (double-click used for zoom)
    if (e.detail > 1) {
      clearPending();
      return;
    }

    const clientX = e.clientX;
    clearPending();
    pending = window.setTimeout(() => {
      pending = null;
      const rect = surface.getBoundingClientRect();
      // Left 40% → prev, right 60% → next
      const threshold = rect.left + rect.width * 0.4;
      if (clientX < threshold) onPrev();
      else onNext();
    }, 220);
  };

  const handleDoubleClick = () => {
    clearPending();
  };

  surface.addEventListener("click", handleClick);
  surface.addEventListener("dblclick", handleDoubleClick);

  return {
    destroy: () => {
      clearPending();
      surface.removeEventListener("click", handleClick);
      surface.removeEventListener("dblclick", handleDoubleClick);
    },
  };
}
