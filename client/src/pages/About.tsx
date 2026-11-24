import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-24 text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2"
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[4/3] bg-muted"
        >
          <img
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625"
            alt="Who Is Ethan Fryer"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="max-w-xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">About D.EF</h1>

          <div className="prose prose-lg prose-invert prose-headings:text-foreground prose-p:text-muted-foreground">
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