import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HeaderState {
  isVisible: boolean;
  projectId: string | null;
  scrollPosition: number;
}

interface ProjectContextType {
  isProjectExpanded: boolean;
  setProjectExpanded: (expanded: boolean) => void;
  shouldRevealHeader: boolean;
  setShouldRevealHeader: (reveal: boolean) => void;
  headerStates: Map<string, HeaderState>;
  setHeaderState: (projectId: string, state: Partial<HeaderState>) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [isProjectExpanded, setProjectExpanded] = useState(false);
  const [shouldRevealHeader, setShouldRevealHeader] = useState(false);
  const [headerStates, setHeaderStates] = useState<Map<string, HeaderState>>(new Map());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const setHeaderState = (projectId: string, state: Partial<HeaderState>) => {
    setHeaderStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(projectId) || {
        isVisible: true,
        projectId,
        scrollPosition: window.scrollY
      };
      newStates.set(projectId, { ...currentState, ...state });
      return newStates;
    });
  };

  useEffect(() => {
    // Reset header state whenever project expand state changes
    setShouldRevealHeader(false);

    const handleScroll = () => {
      if (!isProjectExpanded || !currentProjectId) return;

      const currentScrollY = window.scrollY;
      setShouldRevealHeader(true);

      // Update scroll position in header state
      setHeaderState(currentProjectId, {
        scrollPosition: currentScrollY
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProjectExpanded, currentProjectId]);

  return (
    <ProjectContext.Provider value={{ 
      isProjectExpanded, 
      setProjectExpanded,
      shouldRevealHeader,
      setShouldRevealHeader,
      headerStates,
      setHeaderState,
      currentProjectId,
      setCurrentProjectId
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