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
    const handleScroll = () => {
      if (!isProjectExpanded) {
        setShouldRevealHeader(false);
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      // Immediate response to scroll
      if (scrollDifference < 0) { // Scrolling up
        setShouldRevealHeader(true);
      } else if (scrollDifference > 0) { // Scrolling down
        setShouldRevealHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
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