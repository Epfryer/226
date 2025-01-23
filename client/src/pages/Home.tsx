import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { projects } from "@/lib/projects";

export default function Home() {
  const [location] = useLocation();
  const category = new URLSearchParams(location.split('?')[1]).get('category');

  const filteredProjects = useMemo(() => 
    category 
      ? projects.filter(p => p.category === category)
      : projects,
    [category]
  );

  return (
    <div className="pt-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={category || 'all'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-28"
          >
            <ProjectGrid projects={filteredProjects} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}