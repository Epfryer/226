type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void | Promise<unknown>;
    };
  }
}

/** Replit supplies the tracker on published sites with analytics enabled. */
export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;
  try {
    const result = window.umami?.track(name, data);
    // Rejected tracker requests must not become unhandled rejections.
    if (result) void Promise.resolve(result).catch(() => {});
  } catch {
    // Analytics must never interrupt the visitor's action.
  }
}
