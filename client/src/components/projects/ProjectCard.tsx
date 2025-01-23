import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <a className="block relative group border-b border-r border-gray-100">
        <motion.div
          whileHover={{ scale: 0.98 }}
          className="relative aspect-[4/3]"
        >
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

          <div className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white text-lg font-medium">{project.title}</h3>
            <p className="text-white text-sm mt-1">
              {project.location}, {project.year}
            </p>
          </div>
        </motion.div>
      </a>
    </Link>
  );
}