import { motion } from "framer-motion";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <div className="pt-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl">
            We are an architecture studio creating extraordinary spaces
          </h1>
        </div>

        <ProjectGrid projects={projects} />
      </motion.div>
    </div>
  );
}
