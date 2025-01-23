import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { projects } from "@/lib/projects";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => 
    Array.from(new Set(projects.map(p => p.category))).sort(),
    []
  );

  const filteredProjects = useMemo(() => 
    activeCategory 
      ? projects.filter(p => p.category === activeCategory)
      : projects,
    [activeCategory]
  );

  return (
    <div className="pt-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl mb-12">
            We are an architecture studio creating extraordinary spaces
          </h1>
          <ProjectFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <AnimatePresence mode="wait">
          <ProjectGrid key={activeCategory || 'all'} projects={filteredProjects} />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}