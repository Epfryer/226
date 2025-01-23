import { motion } from "framer-motion";
import type { Project } from "@/lib/projects";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-4xl font-bold">{project.title}</h1>
          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Location</h2>
              <p className="mt-1">{project.location}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Year</h2>
              <p className="mt-1">{project.year}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Category</h2>
              <p className="mt-1">{project.category}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Description</h2>
              <p className="mt-1">{project.description}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
