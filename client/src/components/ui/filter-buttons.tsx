
import { Button } from "@/components/ui/button"

interface FilterButtonsProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function FilterButtons({ categories, selectedCategory, onCategoryChange }: FilterButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onCategoryChange(null)}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
