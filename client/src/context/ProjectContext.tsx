
import React, { createContext, useContext, useState } from 'react';

interface ProjectContextType {
  isProjectExpanded: boolean;
  setIsProjectExpanded: (value: boolean) => void;
  shouldRevealHeader: boolean;
  setShouldRevealHeader: (value: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [isProjectExpanded, setIsProjectExpanded] = useState(false);
  const [shouldRevealHeader, setShouldRevealHeader] = useState(false);

  return (
    <ProjectContext.Provider
      value={{
        isProjectExpanded,
        setIsProjectExpanded,
        shouldRevealHeader,
        setShouldRevealHeader,
      }}
    >
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
