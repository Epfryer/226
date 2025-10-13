/**
 * Viewport utilities for PDF rendering with aspect ratio preservation
 */

/**
 * Calculates optimal render dimensions to fit a page in a container
 * while preserving the page's aspect ratio
 */
export function getViewportSize(
  container: HTMLElement,
  pageViewport: { width: number; height: number }
) {
  const aspect = pageViewport.width / pageViewport.height;
  let renderW = container.clientWidth;
  let renderH = renderW / aspect;
  
  if (renderH > container.clientHeight) {
    renderH = container.clientHeight;
    renderW = renderH * aspect;
  }
  
  return { renderW, renderH };
}

/**
 * Detects if the current device is running iOS
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Gets the device pixel ratio, clamped appropriately for the platform
 * iOS devices are clamped to ≤2 to avoid memory issues
 */
export function getClampedDPR(): number {
  const isIOS = isIOSDevice();
  const dpr = window.devicePixelRatio || 1;
  return isIOS ? Math.min(dpr, 2) : dpr;
}

/**
 * Maximum number of active canvases to keep in memory
 * Helps prevent memory issues on mobile devices
 */
export const PDFJS_MAX_ACTIVE_CANVASES = 3;

/**
 * Maximum DPR for iOS devices
 * Can be overridden via environment variable
 */
export const IOS_CANVAS_DPR_MAX = 2;
