import type { Publication } from "../data/publications";

export interface PublicProduct {
  id: number;
  name: string;
  thumbnail_url?: string;
  variants: number;
  synced: number;
}
export interface PublicPageData {
  url: string;
  status: number;
  publications?: Publication[];
  products?: PublicProduct[];
  unavailable?: string;
}
export function readPublicPageData(): PublicPageData | undefined {
  if (typeof document === "undefined") return undefined;
  const json = document.getElementById("public-page-data")?.textContent;
  return json ? JSON.parse(json) : undefined;
}
