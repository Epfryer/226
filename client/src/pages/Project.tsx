import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { findProject } from "@/lib/public-routes";
import NotFound from "./not-found";

export default function Project() {
  const [location] = useLocation();
  const project = findProject(location);
  if (!project) return <NotFound />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-6 pt-24"
    >
      <a href="/projects" className="inline-block mb-6 underline">All projects</a>
      <ProjectDetail project={project} />
    </motion.div>
  );
}
