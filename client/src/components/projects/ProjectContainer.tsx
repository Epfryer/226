import { useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { projects } from "@/lib/projects";

export default function ProjectContainer() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProjects = projects.filter(
    (project) => selectedCategory === "All" || project.category === selectedCategory
  );

  return (
    <div className="container px-0 max-w-none w-full" style={{ opacity: 1 }}>
      <div className="flex justify-center mb-12">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            className={`px-4 py-2 text-sm uppercase tracking-wide border transition-colors ${
              selectedCategory === "All"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-foreground hover:border-primary"
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>
          {Array.from(new Set(projects.map((p) => p.category))).map((category) => (
            <button
              key={category}
              className={`px-4 py-2 text-sm uppercase tracking-wide border transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground hover:border-primary"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div style={{ opacity: 1 }}>
        <div className="space-y-0">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isExpanded={expandedId === project.id}
              onExpand={setExpandedId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}