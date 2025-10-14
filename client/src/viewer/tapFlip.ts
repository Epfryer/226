export function enableTapFlip(
  surface: HTMLElement,
  getScale: () => number,
  fitScale: () => number,
  onPrev: () => void,
  onNext: () => void
): { destroy: () => void } {
  let lastTap = 0;

  const handleClick = (e: MouseEvent) => {
    if (e.defaultPrevented) return;

    const now = Date.now();
    if (now - lastTap < 300) {
      lastTap = now;
      return;
    }
    lastTap = now;

    if (getScale() > fitScale() * 1.02) return;

    const rect = surface.getBoundingClientRect();
    const mid = rect.left + rect.width * 0.4;
    if (e.clientX < mid) onPrev();
    else onNext();
  };

  surface.addEventListener("click", handleClick);

  return {
    destroy: () => {
      surface.removeEventListener("click", handleClick);
    },
  };
}
