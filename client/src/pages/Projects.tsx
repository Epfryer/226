import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { projects } from "@/lib/projects";
import { trackEvent } from "@/lib/analytics";
import "./projects-archive.css";

export default function Projects() {
  const reduceMotion = useReducedMotion();
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
    <div className="project-archive">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="project-archive-inner"
      >
        <header className="project-archive-header">
          <div className="project-archive-heading">
            <p className="project-archive-kicker">Ethan Fryer <span>/</span> Project archive</p>
            <h1>Projects &amp; spatial studies</h1>
          </div>
          <p className="project-archive-count" aria-live="polite">
            <span>{filteredProjects.length.toString().padStart(2, "0")}</span>
            <span>works</span>
          </p>
        </header>

        <nav className="project-archive-filters" aria-label="Filter projects by category">
          <ProjectFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={(category) => {
              setActiveCategory(category);
              trackEvent("project_category_selected", { category: category || "all" });
            }}
          />
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory || "all"}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <ProjectGrid projects={filteredProjects} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
