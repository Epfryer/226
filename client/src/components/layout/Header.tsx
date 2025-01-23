import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full z-50 bg-white">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold">BIG</a>
        </Link>
        
        <button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="hidden md:flex space-x-8">
          <Link href="/about">
            <a className="hover:opacity-70 transition-opacity">About</a>
          </Link>
          <Link href="/contact">
            <a className="hover:opacity-70 transition-opacity">Contact</a>
          </Link>
        </nav>
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
              <Link href="/about">
                <a className="hover:opacity-70 transition-opacity">About</a>
              </Link>
              <Link href="/contact">
                <a className="hover:opacity-70 transition-opacity">Contact</a>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
