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
    <div className="w-full flex justify-center px-4"> {/* Added container with full width */}
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto"> {/* Added max-width and auto margins */}
        <Button
          variant={!activeCategory ? "default" : "outline"}
          aria-pressed={activeCategory === null}
          onClick={() => handleClick(null)}
          className="transition-all"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={category === activeCategory ? "default" : "outline"}
            aria-pressed={category === activeCategory}
            onClick={() => handleClick(category)}
            className="transition-all"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}