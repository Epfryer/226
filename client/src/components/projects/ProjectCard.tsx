import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <a className="block relative group hover:opacity-90 transition-opacity mb-12">
        <div className="grid grid-cols-[300px,1fr] gap-8">
          <div className="pt-8">
            <h3 className="text-xl font-medium">{project.title}</h3>
            <p className="text-gray-600 mt-2">
              {project.location}, {project.year}
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 0.98 }}
            className="relative aspect-[4/3]"
          >
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </a>
    </Link>
  );
}