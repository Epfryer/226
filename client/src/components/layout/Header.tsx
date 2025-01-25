import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isProjectExpanded, shouldRevealHeader } = useProject();

  const getXPosition = () => {
    if (!isProjectExpanded) return 0;
    if (shouldRevealHeader) return 0;
    return -100;
  };

  return (
    <header className="fixed top-0 left-0 z-50 p-6">
      <div>
        <div className="flex items-start">
          <Link href="/">
            <a className="text-2xl font-bold">D.EF</a>
          </Link>
        </div>

        <motion.div 
          className="hidden md:block mt-6"
          initial={false}
          animate={{
            x: getXPosition(),
            opacity: isProjectExpanded && !shouldRevealHeader ? 0 : 1
          }}
          transition={{ 
            duration: isProjectExpanded && !shouldRevealHeader ? 2 : 0.5, 
            ease: "easeInOut" 
          }}
        >
          <nav className="flex flex-col space-y-4 text-sm">
            <Link href="/">
              <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">Projects</a>
            </Link>
            <Link href="/about">
              <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">About</a>
            </Link>
            <Link href="/contact">
              <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">Contact</a>
            </Link>
          </nav>
        </motion.div>

        <motion.button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          animate={{
            opacity: isProjectExpanded && !shouldRevealHeader ? 0 : 1,
            scale: isProjectExpanded && !shouldRevealHeader ? 0.8 : 1
          }}
          transition={{ 
            duration: isProjectExpanded && !shouldRevealHeader ? 2 : 0.5, 
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && !isProjectExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-16 left-0 bg-white py-4 px-6 md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              <Link href="/">
                <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">Projects</a>
              </Link>
              <Link href="/about">
                <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">About</a>
              </Link>
              <Link href="/contact">
                <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">Contact</a>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}