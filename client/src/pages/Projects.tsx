import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { projects } from "@/lib/projects";
import { trackEvent } from "@/lib/analytics";

export default function Projects() {
  const [location] = useLocation();
  const urlCategory = new URLSearchParams(location.split("?")[1]).get("category");
  const [activeCategory, setActiveCategory] = useState<string | null>(urlCategory);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});

  const categories = useMemo(
    () => Array.from(new Set(projects.map((project) => project.category))).sort(),
    []
  );

  const filteredProjects = useMemo(
    () =>
      activeCategory
        ? projects.filter((project) => project.category === activeCategory)
        : projects,
    [activeCategory]
  );

  return (
    <div className="project-archive">
        <div className="project-archive-heading">
          <p>Project archive</p>
          <h1>Selected works and ongoing studies.</h1>
          <p className="project-archive-intro">
            Browse the evolving body of work — academic projects, competitions, speculative proposals, and architectural studies.
          </p>
        </div>

        <div className="project-archive-filters">
          <ProjectFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={(category) => {
              setActiveCategory(category);
              trackEvent("project_category_selected", { category: category || "all" });
            }}
          />
        </div>

        <ProjectGrid
          projects={filteredProjects}
          expandedIds={expandedIds}
          slideIndices={slideIndices}
          onExpandedChange={(id, expanded) => {
            setExpandedIds((current) => {
              const next = new Set(current);
              if (expanded) next.add(id);
              else next.delete(id);
              return next;
            });
            trackEvent(expanded ? "project_expanded" : "project_closed", { project_id: id });
          }}
          onSlideChange={(id, index) => setSlideIndices((current) => current[id] === index ? current : { ...current, [id]: index })}
        />
    </div>
  );
}
