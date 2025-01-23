import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { projects } from "@/lib/projects";

export default function Project() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  
  const project = projects.find(p => p.id === params?.id);

  useEffect(() => {
    if (!project) {
      setLocation("/");
    }
  }, [project, setLocation]);

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24"
    >
      <ProjectDetail project={project} />
    </motion.div>
  );
}
