import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectContextType {
  isProjectExpanded: boolean;
  setProjectExpanded: (expanded: boolean) => void;
  shouldRevealHeader: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [isProjectExpanded, setProjectExpanded] = useState(false);
  const [shouldRevealHeader, setShouldRevealHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (!isProjectExpanded) {
        setShouldRevealHeader(false);
        return;
      }

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - lastScrollY;

        // Add a threshold for scroll detection
        if (Math.abs(scrollDifference) > 10) {
          if (scrollDifference < 0) { // Scrolling up
            setShouldRevealHeader(true);
          } else { // Scrolling down
            setShouldRevealHeader(false);
          }
          setLastScrollY(currentScrollY);
        }
      }, 50); // Debounce scroll events
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isProjectExpanded, lastScrollY]);

  return (
    <ProjectContext.Provider value={{ 
      isProjectExpanded, 
      setProjectExpanded,
      shouldRevealHeader 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}