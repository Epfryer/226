import { useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { projects } from "@/lib/projects";
// ...existing imports...

export default function Projects() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  return (
    <div className="px-0 max-w-none w-full" style={{ opacity: 1 }}> {/* Removed padding to allow for centering */}
      <div className="flex justify-center mb-12">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {/* ...filter buttons... */}
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
