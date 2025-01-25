import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectContextType {
  isProjectExpanded: boolean;
  setProjectExpanded: (expanded: boolean) => void;
  shouldRevealHeader: boolean;
  setShouldRevealHeader: (reveal: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [isProjectExpanded, setProjectExpanded] = useState(false);
  const [shouldRevealHeader, setShouldRevealHeader] = useState(false);

  useEffect(() => {
    // Reset header state whenever project expand state changes
    if (isProjectExpanded) {
      setShouldRevealHeader(false);
    }

    const handleScroll = () => {
      if (!isProjectExpanded) return;
      setShouldRevealHeader(true);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProjectExpanded]);

  return (
    <ProjectContext.Provider value={{ 
      isProjectExpanded, 
      setProjectExpanded,
      shouldRevealHeader,
      setShouldRevealHeader
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