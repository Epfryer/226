import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { projects } from "@/lib/projects";

export default function Projects() {
  const [location] = useLocation();
  const urlCategory = new URLSearchParams(location.split("?")[1]).get("category");
  const [activeCategory, setActiveCategory] = useState<string | null>(urlCategory);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((project) => project.category))).sort(),
    []
  );

  const filteredProjects = useMemo(
    () =>
      activeCategory
        ? projects.filter((project) => project.category === activeCategory)
        : projects,
    [activeCategory]
  );

  return (
    <div className="pt-32">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto px-0"
      >
        <div className="mb-8 px-6 md:px-10 lg:px-16">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Project archive</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Selected works and ongoing studies.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/65 md:text-lg">
            Browse the evolving body of work — academic projects, competitions, speculative proposals, and architectural studies.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <ProjectFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory || "all"}
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
