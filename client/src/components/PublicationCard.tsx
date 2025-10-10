
import { motion } from "framer-motion";
import type { Publication } from "@/data/publications";

interface PublicationCardProps {
  pub: Publication;
  onOpen: (pub: Publication) => void;
}

export function PublicationCard({ pub, onOpen }: PublicationCardProps) {
  return (
    <motion.button
      layoutId={pub.slug}
      onClick={() => onOpen(pub)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition hover:shadow-xl"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      aria-label={`Open ${pub.title}`}
    >
      {/* Fixed height, variable width based on aspect ratio */}
      <div className="relative h-[400px] md:h-[500px] bg-neutral-200 overflow-hidden">
        {pub.coverPath ? (
          <img
            src={pub.coverPath}
            alt={pub.title}
            loading="lazy"
            className="h-full w-auto object-cover"
            width={1200}
            height={1600}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <span className="text-4xl font-bold text-muted-foreground/30">PDF</span>
          </div>
        )}

        {/* Gradient overlay for text legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0 opacity-90 transition-opacity group-hover:opacity-100" />

        {/* Title and date overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h3 className="text-white/95 drop-shadow-md text-lg md:text-xl font-semibold leading-tight mb-1 line-clamp-2">
            {pub.title}
          </h3>
          <p className="text-white/80 text-sm">{pub.year}</p>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.button>
  );
}
