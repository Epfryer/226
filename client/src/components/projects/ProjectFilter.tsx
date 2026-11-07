import { useCallback } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="project-filter-list">
        <Button
          variant="ghost"
          aria-pressed={activeCategory === null}
          onClick={() => handleClick(null)}
          className={`project-filter-button${activeCategory === null ? " is-active" : ""}`}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant="ghost"
            aria-pressed={category === activeCategory}
            onClick={() => handleClick(category)}
            className={`project-filter-button${category === activeCategory ? " is-active" : ""}`}
          >
            {category}
          </Button>
        ))}
    </div>
  );
}