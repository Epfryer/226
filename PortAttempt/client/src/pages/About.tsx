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
            alt="BIG Architecture Office"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-8">About BIG</h1>

          <div className="prose prose-lg">
            <p>
              BIG-Bjarke Ingels Group is a Copenhagen, New York, London and Barcelona based group of architects, designers, urbanists, landscape professionals, interior and product designers, researchers and inventors.
            </p>

            <p>
              The office is currently involved in a large number of projects throughout Europe, North America, Asia and the Middle East. BIG's architecture emerges out of a careful analysis of how contemporary life constantly evolves and changes.
            </p>

            <p>
              Like a form of programmatic alchemy, we create architecture by mixing conventional ingredients such as living, leisure, working, parking and shopping. By hitting the fertile overlap between pragmatic and utopia, we architects once again find the freedom to change the surface of our planet, to better fit contemporary life forms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}