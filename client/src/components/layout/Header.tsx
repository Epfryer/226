import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { projects } from "@/lib/projects";

const categories = Array.from(new Set(projects.map(p => p.category))).sort();

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleCategoryClick = useCallback((category: string) => {
    setLocation(`/?category=${category}`);
    setIsOpen(false);
  }, [setLocation]);

  return (
    <header className="fixed w-full z-50 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="py-4 flex items-center justify-center">
          <Link href="/">
            <a className="text-2xl font-bold">BIG</a>
          </Link>
        </div>

        <div className="hidden md:block">
          <nav className="flex justify-center py-4 text-sm">
            <div className="flex space-x-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="hover:opacity-70 transition-opacity uppercase tracking-wide"
                >
                  {category}
                </button>
              ))}
              <Link href="/about">
                <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">About</a>
              </Link>
              <Link href="/contact">
                <a className="hover:opacity-70 transition-opacity uppercase tracking-wide">Contact</a>
              </Link>
            </div>
          </nav>
        </div>

        <button 
          className="md:hidden absolute top-4 right-6"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white py-4 px-6 md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="hover:opacity-70 transition-opacity text-left uppercase tracking-wide"
                >
                  {category}
                </button>
              ))}
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