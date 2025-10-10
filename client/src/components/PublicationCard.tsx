import { motion } from "framer-motion";
import type { Publication } from "@/data/publications";

interface PublicationCardProps {
  pub: Publication;
  onOpen: (pub: Publication) => void;
}

export function PublicationCard({ pub, onOpen }: PublicationCardProps) {
  return (
    <motion.button
      onClick={() => onOpen(pub)}
      className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 w-full text-left"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      aria-label={`Open ${pub.title}`}
    >
      <motion.div layoutId={pub.slug} className="aspect-[3/4] bg-muted relative">
        {pub.coverPath ? (
          <img
            src={pub.coverPath}
            alt={pub.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <span className="text-4xl font-bold text-muted-foreground/30">PDF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
      
      <div className="p-4 bg-card">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{pub.title}</h3>
        <p className="text-sm text-muted-foreground">{pub.year}</p>
      </div>
    </motion.button>
  );
}
