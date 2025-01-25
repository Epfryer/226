import { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  isProjectExpanded: boolean;
  setProjectExpanded: (expanded: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [isProjectExpanded, setProjectExpanded] = useState(false);

  return (
    <ProjectContext.Provider value={{ isProjectExpanded, setProjectExpanded }}>
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
