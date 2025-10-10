
export interface Publication {
  slug: string;
  title: string;
  year: string;
  pdfPath: string;
  coverPath?: string;
}

export const PUBLICATIONS: Publication[] = [
  {
    slug: "hybrid-urbanism",
    title: "Hybrid Urbanism",
    year: "2025",
    pdfPath: "/publications/hybrid-urbanism.pdf",
    coverPath: "/publications/hybrid-urbanism.jpg"
  }
];
