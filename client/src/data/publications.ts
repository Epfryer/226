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
    pdfPath: "/api/publications/hybrid-urbanism.pdf",
    coverPath: "publications/hybrid-urbanism.jpg"
  },
  {
    slug: "5th-year-selected-works",
    title: "5th Year Selected Works",
    year: "2024",
    pdfPath: "/api/publications/EthanFryer_5thYear_SelectedWorks.pdf",
    coverPath: "publications/EthanFryer_5thYear_SelectedWorks.jpg"
  }
];
