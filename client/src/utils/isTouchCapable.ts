export function isTouchCapable(): boolean {
  return (
    typeof window !== "undefined" &&
    (("ontouchstart" in window) ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      (matchMedia?.("(pointer: coarse)").matches ?? false))
  );
}
