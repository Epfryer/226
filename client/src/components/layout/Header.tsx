import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useProject } from "@/context/ProjectContext";
import { m as motion, useReducedMotion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { useMobileNavigation } from "./use-mobile-navigation";

export function Header({ white = false, actions }: { white?: boolean; actions?: ReactNode }) {
  const { isProjectExpanded, shouldRevealHeader } = useProject();
  const { isOpen, setIsOpen, buttonRef, menuRef } = useMobileNavigation(isProjectExpanded);
  const reducedMotion = useReducedMotion();
  const [location] = useLocation();
  const isAboutPage = white || location === "/about";
  const path = location.split("?")[0];
  const sectionLabel = path === "/" ? "Home"
    : path === "/about" ? "About"
    : path.startsWith("/project/") || path === "/projects" ? "Projects"
    : path === "/publications" || path.startsWith("/publication/") ? "Publications"
    : path === "/studio" || path.startsWith("/studio/") ? "Studio"
    : "Home";
  const navigationHidden = isProjectExpanded && !shouldRevealHeader;
  const linkClass = `hover:opacity-70 transition-opacity uppercase tracking-wide px-3 py-1 rounded-sm ${isAboutPage ? "text-white" : ""}`;
  const links = [
    ["/about", "About"],
    ["/projects", "Projects"],
    ["/publications", "Publications"],
    ["/studio", "Studio"],
  ];
  const projectsMenuRef = useRef<HTMLDivElement>(null);
  const projectsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const suppressFocusOpen = useRef(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [projectsMenuPinned, setProjectsMenuPinned] = useState(false);

  useEffect(() => {
    setProjectsMenuOpen(false);
    setProjectsMenuPinned(false);
  }, [location]);

  useEffect(() => {
    if (!projectsMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!projectsMenuRef.current?.contains(event.target as Node)) {
        setProjectsMenuOpen(false);
        setProjectsMenuPinned(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setProjectsMenuOpen(false);
      setProjectsMenuPinned(false);
      if (document.activeElement !== projectsMenuButtonRef.current) {
        suppressFocusOpen.current = true;
        projectsMenuButtonRef.current?.focus();
      } else {
        suppressFocusOpen.current = false;
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [projectsMenuOpen]);

  const headerStyle = {
    opacity: navigationHidden ? 0 : 1,
    transform: navigationHidden && !reducedMotion ? 'translateX(-100px)' : 'none',
    visibility: navigationHidden ? "hidden" as const : "visible" as const,
  };

  return (
    <header className="portfolio-header pointer-events-none fixed top-0 left-0 z-50 w-full p-6">
      <div className="md:flex md:items-start md:gap-8">
        <div className="flex items-center justify-between md:justify-start md:gap-8">
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
            ref={projectsMenuRef}
            className="projects-nav-menu pointer-events-auto relative hidden md:inline-block"
            style={headerStyle}
            onPointerEnter={() => setProjectsMenuOpen(true)}
            onPointerLeave={() => {
              if (!projectsMenuPinned && !projectsMenuRef.current?.contains(document.activeElement)) {
                setProjectsMenuOpen(false);
              }
            }}
            onFocus={(event) => {
              if (suppressFocusOpen.current) {
                suppressFocusOpen.current = false;
                return;
              }
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setProjectsMenuOpen(true);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setProjectsMenuOpen(false);
                setProjectsMenuPinned(false);
              }
            }}
          >
            <button
              ref={projectsMenuButtonRef}
              type="button"
              className="projects-nav-toggle min-h-11 px-1 text-[11px] uppercase tracking-[.16em] pl-[4px] pr-[4px] ml-[-29px] mr-[-29px]"
              aria-expanded={projectsMenuOpen}
              aria-label={`${sectionLabel} navigation`}
              aria-controls="projects-primary-navigation"
              aria-haspopup="true"
              onClick={() => {
                const nextOpen = !projectsMenuOpen || !projectsMenuPinned;
                setProjectsMenuOpen(nextOpen);
                setProjectsMenuPinned(nextOpen);
              }}
            >
              {sectionLabel} <span aria-hidden="true">{projectsMenuOpen ? "−" : "+"}</span>
            </button>
            <nav
              id="projects-primary-navigation"
              aria-label={`${sectionLabel} navigation links`}
              hidden={!projectsMenuOpen}
              className={`projects-nav-panel absolute left-0 top-full min-w-44 py-3 ${isAboutPage ? "projects-nav-panel--dark" : ""}`}
            >
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  className={`${linkClass} block py-2`}
                  href={href}
                  aria-current={location === href ? "page" : undefined}
                  onClick={() => {
                    setProjectsMenuOpen(false);
                    setProjectsMenuPinned(false);
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        <div>
          {actions && <div className="pointer-events-auto absolute right-20 top-5 md:right-6">{actions}</div>}
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