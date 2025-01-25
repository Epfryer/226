import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectContextType {
  isProjectExpanded: boolean;
  setProjectExpanded: (expanded: boolean) => void;
  isHeaderHidden: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [isProjectExpanded, setProjectExpanded] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!isProjectExpanded) {
        setIsHeaderHidden(false);
        return;
      }

      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProjectExpanded, lastScrollY]);

  return (
    <ProjectContext.Provider value={{ isProjectExpanded, setProjectExpanded, isHeaderHidden }}>
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