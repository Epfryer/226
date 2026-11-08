import type { Project } from "./projects";
import type { Publication } from "../data/publications";

type FeedEntry =
  | { kind: "project"; item: Project }
  | { kind: "publication"; item: Publication };

// Use the catalog's completion years, not upload dates or legacy metadata tags.
// Stable ties preserve the existing relative order within each year.
export function chronologicalFeed(projects: Project[], publications: Publication[]): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...projects.map((item) => ({ kind: "project" as const, item })),
    ...publications.map((item) => ({ kind: "publication" as const, item })),
  ];
  const year = (entry: FeedEntry) => {
    const value = Number(entry.item.year);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  return entries.sort((a, b) => year(b) - year(a));
}
