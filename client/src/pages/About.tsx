import { motion } from "framer-motion";
import { Timeline } from "@/components/Timeline";

export default function About() {
  const timelineData = [
    {
      title: "2024",
      content: (
        <div>
          <p className="text-white text-xs md:text-sm font-normal mb-8">
            Current B.Arch Student at Virginia Tech College of Architecture Arts and Design
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738289072/Circus_kaz4or.jpg"
              alt="2024 Project"
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full"
            />
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738293955/Loom_Haus_wmrmis.jpg"
              alt="2024 Project"
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <p className="text-white text-xs md:text-sm font-normal mb-8">
            Explored various architectural concepts and completed significant projects
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738337829/Statue_Haus_nsmoxh.jpg"
              alt="2023 Project"
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full"
            />
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738343812/Bike_Hub_uxsk4l.jpg"
              alt="2023 Project"
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-24">
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
            <h1 className="text-4xl font-bold mb-8 text-white">About D.EF</h1>

            <div className="prose prose-lg text-white">
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
        <Timeline data={timelineData} />
      </div>
    </div>
  );
}