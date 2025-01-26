import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="flex min-h-screen items-center justify-center py-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2"
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[4/3] bg-gray-100"
        >
          <img
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625"
            alt="Who Is Ethan Fryer"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-8">About D.EF</h1>

          <div className="prose prose-lg">
            <p>
            a passionate advocate for the transformative power of architecture and lifelong learning. With a strong academic background in architecture, I've cultivated a deep appreciation for the art of designing spaces that harmonize with their surroundings and positively impact communities. I thrive on creative problem-solving and am dedicated to staying at the forefront of industry advancements. Outside of architecture, I enjoy, Personal Fitness, Photography, Robotics and hiking. I'm excited about the opportunity to contribute my skills and enthusiasm to projects that make a difference.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}