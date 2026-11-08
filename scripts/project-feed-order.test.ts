import assert from "node:assert/strict";
import { test } from "node:test";
import { chronologicalFeed } from "../client/src/lib/project-feed-order";
import { projects } from "../client/src/lib/projects";
import type { Publication } from "../client/src/data/publications";

const publications: Publication[] = [
  { slug: "older", title: "Older book", year: "2023", pdfPath: "/older.pdf" },
  { slug: "newest", title: "Newest book", year: "2026", pdfPath: "/newest.pdf" },
  { slug: "middle", title: "Middle book", year: "2024", pdfPath: "/middle.pdf" },
];

test("projects and publications share a newest-first completion-year timeline", () => {
  const projectOrder = projects.map((project) => project.id);
  const publicationOrder = publications.map((publication) => publication.slug);
  const entries = chronologicalFeed(projects, publications);
  const years = entries.map((entry) => Number(entry.item.year));
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  assert.equal(entries.length, projects.length + publications.length);
  assert.equal(entries[0].item.title, "Newest book");
  assert.equal(entries.at(-1)?.item.year, 2021);
  assert.deepEqual(projects.map((project) => project.id), projectOrder);
  assert.deepEqual(publications.map((publication) => publication.slug), publicationOrder);
  for (const year of new Set(projects.map((project) => project.year))) {
    assert.deepEqual(
      entries.filter((entry) => entry.kind === "project" && entry.item.year === year).map((entry) => entry.item),
      projects.filter((project) => project.year === year),
    );
  }
});

test("category-only feeds use the same chronology, including publications", () => {
  assert.deepEqual(chronologicalFeed([], publications).map((entry) => entry.item.year), ["2026", "2024", "2023"]);
  const competition = projects.filter((project) => project.category === "Competition");
  const entries = chronologicalFeed(competition, []);
  assert(entries.every((entry) => entry.kind === "project" && entry.item.category === "Competition"));
  assert.equal(entries.length, competition.length);
});
