import { useEffect } from "react";
import { useLocation } from "wouter";
import { renderPageMetadata } from "@/lib/site-metadata";

/** Keep client-side navigation in sync with the metadata served in initial HTML. */
export function PageMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    document.head.querySelectorAll("[data-site-metadata]").forEach((element) => element.remove());
    document.head.insertAdjacentHTML("beforeend", renderPageMetadata(location));
  }, [location]);
  return null;
}
