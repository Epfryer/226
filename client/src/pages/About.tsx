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
          className="aspect-[1/1] bg-gray-100"
        >
          <img
            src="https://res.cloudinary.com/dtxqagii0/image/upload/v1740596263/Facetune_26-02-2025-12-56-48_adljiy.jpg"
            alt="Who Is Ethan Fryer"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-8">About D.EF</h1>

          <div className="prose prose-lg">
            <p>
              Ethan Fryer is an architecture student at Virginia Tech College of Architecture Arts and Design.
            </p>

            <p>
              Coming soon
            </p>

            <p>
              stay tuned
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}