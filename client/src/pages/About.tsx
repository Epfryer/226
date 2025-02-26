import { motion } from "framer-motion";
import { GradientSection } from "@/components/ui/gradient-section";
import { Timeline } from "@/components/ui/timeline";

const timelineItems = [
  {
    year: "2024",
    title: "Virginia Tech CAUS",
    description: "Currently studying Architecture at Virginia Tech College of Architecture and Urban Studies"
  },
  {
    year: "2023",
    title: "Design Portfolio",
    description: "Started building comprehensive portfolio of architectural designs and projects"
  },
  {
    year: "2022",
    title: "First Architectural Project",
    description: "Completed first major architectural design project"
  }
];

export default function About() {
  return (
    <GradientSection inverted className="flex flex-col">
      <motion.div 
        className="min-h-screen flex items-center justify-center py-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-[4/3] overflow-hidden rounded-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1487958449943-2429e8be8625"
              alt="Ethan Fryer"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="max-w-xl">
            <h1 className="text-4xl font-bold mb-8 text-white">About D.EF</h1>
            <div className="prose prose-lg text-white">
              <p>
                Ethan Fryer is an architecture student at Virginia Tech College of Architecture Arts and Design, 
                passionate about creating spaces that blend functionality with innovative design.
              </p>
              <p>
                With a keen eye for detail and a commitment to sustainable architecture, 
                Ethan approaches each project as an opportunity to push creative boundaries 
                while maintaining practical usability.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="min-h-screen flex items-center justify-center bg-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-black">My Journey</h2>
          <Timeline items={timelineItems} />
        </div>
      </div>
    </GradientSection>
  );
}