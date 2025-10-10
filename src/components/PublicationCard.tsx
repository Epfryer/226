
import { motion } from "framer-motion";
import type { Publication } from "@/data/publications";

interface PublicationCardProps {
  pub: Publication;
  onOpen: (pub: Publication) => void;
}

export function PublicationCard({ pub, onOpen }: PublicationCardProps) {
  return (
    <button
      onClick={() => onOpen(pub)}
      className="group text-left w-full"
      aria-label={`Open ${pub.title}`}
    >
      <motion.div
        className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          layoutId={pub.slug}
          className="aspect-[3/4] w-full bg-neutral-100"
        >
          {pub.coverPath ? (
            <img
              src={pub.coverPath}
              alt={`${pub.title} cover`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400">
              <span className="text-sm">PDF Preview</span>
            </div>
          )}
        </motion.div>
        <div className="p-4">
          <h3 className="font-semibold text-lg group-hover:text-neutral-700 transition-colors">
            {pub.title}
          </h3>
          <p className="text-sm text-neutral-500 mt-1">{pub.year}</p>
        </div>
      </motion.div>
    </button>
  );
}
