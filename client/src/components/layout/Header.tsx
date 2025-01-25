import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { TypingAnimation } from "@/components/ui/typing-animation";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isProjectExpanded, shouldRevealHeader } = useProject();

  const navStyle = {
    opacity: isProjectExpanded ? (shouldRevealHeader ? 1 : 0) : 1,
    transform: isProjectExpanded ? (shouldRevealHeader ? 'none' : 'translateX(-100px)') : 'none',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  };

  const headerStyle = {
    opacity: 1,
    transition: 'opacity 0.3s ease',
  };

  return (
    <header className="fixed top-0 left-0 z-50 p-6">
      <div>
        <div className="flex items-start">
          <Link href="/">
            {isProjectExpanded && !shouldRevealHeader ? (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-light">
                  <TypingAnimation 
                    text="Designed" 
                    duration={100}
                    className="text-primary text-xl font-bold inline"
                  /> by
                </span>
                <TypingAnimation 
                  text="Ethan Fryer"
                  duration={100}
                  className="text-xl font-bold inline"
                />
              </div>
            ) : (
              <a className="text-2xl font-bold">D.EF</a>
            )}
          </Link>
        </div>

        <div 
          className="hidden md:block mt-6"
          style={headerStyle}
        >
          <nav className="flex flex-col space-y-4 text-sm" style={navStyle}>
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