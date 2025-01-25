import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { motion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/typing-animation";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isProjectExpanded, shouldRevealHeader } = useProject();

  const headerStyle = {
    opacity: isProjectExpanded && !shouldRevealHeader ? 0 : 1,
    transform: isProjectExpanded && !shouldRevealHeader ? 'translateX(-100px)' : 'none',
  };

  return (
    <header className="fixed top-0 left-0 z-50 p-6">
      <div>
        <div className="flex items-start">
          <Link href="/">
            <motion.a 
              className="text-2xl font-bold inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                delay: 0.2
              }}
            >
              {isProjectExpanded && !shouldRevealHeader ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-light">Designed by</span>
                  <span className="text-base">
                    <TypingAnimation text="Ethan Fryer" speed={50} delay={200} />
                  </span>
                </div>
              ) : (
                <motion.span
                  initial={{ display: "inline-block" }}
                  animate={{ 
                    opacity: [0, 1],
                    y: [20, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: 0.4
                  }}
                >
                  D.EF
                </motion.span>
              )}
            </motion.a>
          </Link>
        </div>

        <div 
          className="hidden md:block mt-6"
          style={headerStyle}
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
        </div>

        <button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          style={headerStyle}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && !isProjectExpanded && (
          <div
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
          </div>
        )}
      </div>
    </header>
  );
}