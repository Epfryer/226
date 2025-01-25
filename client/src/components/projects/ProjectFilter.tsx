import { useCallback } from "react";
import type { Project } from "@/lib/projects";

interface ProjectFilterProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function ProjectFilter({ categories, activeCategory, onCategoryChange }: ProjectFilterProps) {
  const handleClick = useCallback((category: string | null) => {
    onCategoryChange(category === activeCategory ? null : category);
  }, [activeCategory, onCategoryChange]);

  return (
    <div className="flex justify-center">
      <div className="flex flex-wrap gap-6 text-sm">
        <button
          onClick={() => handleClick(null)}
          className={`transition-all ${!activeCategory ? 'font-medium' : ''}`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleClick(category)}
            className={`transition-all ${category === activeCategory ? 'font-medium' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}