import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <a className="block group">
        <motion.div
          whileHover={{ scale: 0.98 }}
          className="relative aspect-[4/3] overflow-hidden"
        >
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
        </motion.div>
        
        <div className="mt-4">
          <h3 className="text-xl font-medium">{project.title}</h3>
          <p className="text-gray-600 mt-1">
            {project.location}, {project.year}
          </p>
        </div>
      </a>
    </Link>
  );
}
