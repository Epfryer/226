import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { projects } from "@/lib/projects";

export default function Home() {
  const [location] = useLocation();
  const urlCategory = new URLSearchParams(location.split('?')[1]).get('category');
  const [activeCategory, setActiveCategory] = useState<string | null>(urlCategory);

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
    <div className="pt-32">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-6"
      >
        <ProjectFilter 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory || 'all'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProjectGrid projects={filteredProjects} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}