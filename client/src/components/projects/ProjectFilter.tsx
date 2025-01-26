import { useCallback } from 'react';
import { clsx } from 'clsx';

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
    <nav className="fixed top-[88px] left-6 z-40">
      <ul className="flex flex-col space-y-2">
        <li>
          <button
            onClick={() => handleClick(null)}
            className={clsx(
              "text-sm uppercase tracking-wide transition-opacity hover:opacity-70",
              !activeCategory ? "font-medium" : "opacity-50"
            )}
          >
            All
          </button>
        </li>
        {categories.map((category) => (
          <li key={category}>
            <button
              onClick={() => handleClick(category)}
              className={clsx(
                "text-sm uppercase tracking-wide transition-opacity hover:opacity-70",
                category === activeCategory ? "font-medium" : "opacity-50"
              )}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}