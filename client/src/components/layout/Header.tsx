import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { motion, useReducedMotion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { useMobileNavigation } from "./use-mobile-navigation";

export function Header({ white = false }: { white?: boolean }) {
  const { isProjectExpanded, shouldRevealHeader } = useProject();
  const { isOpen, setIsOpen, buttonRef, menuRef } = useMobileNavigation(isProjectExpanded);
  const reducedMotion = useReducedMotion();
  const [location] = useLocation();
  const isAboutPage = white || location === "/about";
  const navigationHidden = isProjectExpanded && !shouldRevealHeader;
  const linkClass = `hover:opacity-70 transition-opacity uppercase tracking-wide px-3 py-1 rounded-sm ${isAboutPage ? "text-white" : ""}`;
  const links = [
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/projects", "Projects"],
    ["/publications", "Publications"],
    ["/studio", "Studio"],
  ];

  const headerStyle = {
    opacity: navigationHidden ? 0 : 1,
    transform: navigationHidden && !reducedMotion ? 'translateX(-100px)' : 'none',
    visibility: navigationHidden ? "hidden" as const : "visible" as const,
  };

  return (
    <header className="portfolio-header pointer-events-none fixed top-0 left-0 z-50 w-full p-6 md:w-48">
      <div>
        <div className="flex items-center justify-between md:block">
          <motion.div 
            className={`pointer-events-auto ml-2 text-2xl font-bold inline-block md:ml-0 ${isAboutPage ? 'text-white' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              delay: 0.2
            }}
          >
            <Link href="/">
              {isProjectExpanded && !shouldRevealHeader ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-light ${isAboutPage ? 'text-white' : ''}`}>Designed by</span>
                  <span className={`text-base ${isAboutPage ? 'text-white' : ''}`}>
                    {reducedMotion ? "Ethan Fryer" : <TypingAnimation text="Ethan Fryer" speed={50} delay={200} />}
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
            </Link>
          </motion.div>
          <button 
            ref={buttonRef}
            type="button"
            className={`pointer-events-auto md:hidden relative z-10 min-h-11 min-w-11 flex items-center justify-center ${isAboutPage ? "text-white" : ""}`}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((open) => !open)}
            style={headerStyle}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div 
          className="pointer-events-auto hidden md:block mt-6"
          style={headerStyle}
        >
          <nav aria-label="Primary navigation" className="flex flex-col space-y-4 text-sm">
            {links.map(([href, label]) => (
              <Link key={href} className={linkClass} href={href} aria-current={location === href ? "page" : undefined}>{label}</Link>
            ))}
          </nav>
        </div>

          <div
            ref={menuRef}
            id="mobile-navigation"
            hidden={!isOpen || isProjectExpanded}
            className={`pointer-events-auto absolute top-20 left-6 right-6 max-h-[calc(100dvh-6rem)] overflow-y-auto ${isAboutPage ? 'bg-[#050505]' : 'bg-white'} py-4 px-6 md:hidden`}
          >
            <nav aria-label="Mobile navigation" className="flex flex-col space-y-4">
              {links.map(([href, label]) => (
                <Link key={href} className={linkClass} href={href} aria-current={location === href ? "page" : undefined} onClick={() => {
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}>{label}</Link>
              ))}
            </nav>
          </div>
      </div>
    </header>
  );
}