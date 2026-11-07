import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects";
import "./project-feed.css";

interface ProjectGridProps {
  projects: Project[];
  expandedIds: ReadonlySet<string>;
  slideIndices: Record<string, number>;
  onExpandedChange: (id: string, expanded: boolean) => void;
  onSlideChange: (id: string, index: number) => void;
}

export function ProjectGrid({ projects, expandedIds, slideIndices, onExpandedChange, onSlideChange }: ProjectGridProps) {
  return (
    <div className="project-feed" aria-label="Project feed">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isExpanded={expandedIds.has(project.id)}
          onExpand={onExpandedChange}
          slideIndex={slideIndices[project.id] ?? 0}
          onSlideChange={(index) => onSlideChange(project.id, index)}
        />
      ))}
    </div>
  );
}
