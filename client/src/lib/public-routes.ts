import { projects, type Project } from "./projects";

export const publicRoutes = ["/", "/about", "/projects", "/publications", "/studio"] as const;
// Existing immutable IDs provide stable addresses, including spaces and punctuation.
export function projectPath(project: Project) {
  return `/project/${encodeURIComponent(project.id)}`;
}
export function findProject(pathname: string) {
  if (!pathname.startsWith("/project/")) return undefined;
  try {
    return projects.find(project => project.id === decodeURIComponent(pathname.slice("/project/".length)));
  } catch {
    return undefined;
  }
}
