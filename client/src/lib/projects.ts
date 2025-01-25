export interface Project {
  id: string;
  title: string;
  location: string;
  year: number;
  description: string;
  image: string;
  category: string;
  metadata: string[];
}

export const projects: Project[] = [
  {
    id: "copenhill",
    title: "Copenhill",
    location: "Copenhagen, Denmark",
    year: 2019,
    description: "A waste-to-energy plant topped with a public ski slope, hiking trail and climbing wall.",
    image: "/docs/proj 30.png",
    images: ["/docs/proj 30.png", "/docs/proj 302.png", "/docs/proj 303.png", "/docs/proj 304.png", "/docs/proj 305.png"],
    category: "Infrastructure",
    metadata: ["2019", "Infrastructure"]
  },
  {
    id: "8-house",
    title: "8 House",
    location: "Copenhagen, Denmark",
    year: 2010,
    description: "A mixed-use development in the shape of a figure 8, featuring apartments, offices and retail.",
    image: "https://images.unsplash.com/photo-1615406020658-6c4b805f1f30",
    category: "Residential"
  },
  {
    id: "via-57-west",
    title: "VIA 57 West",
    location: "New York, USA",
    year: 2016,
    description: "A hybrid between the European perimeter block and a traditional Manhattan high-rise.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
    category: "Residential"
  },
  {
    id: "serpentine",
    title: "Serpentine Pavilion",
    location: "London, UK",
    year: 2016,
    description: "A temporary pavilion design featuring an 'unzipped wall' transformed into a space for gathering.",
    image: "https://images.unsplash.com/photo-1600585153490-76fb20a32601",
    category: "Cultural"
  },
  {
    id: "lego-house",
    title: "LEGO House",
    location: "Billund, Denmark",
    year: 2017,
    description: "A experience center and gathering point for LEGO fans of all ages.",
    image: "https://images.unsplash.com/photo-1520529890308-f503006340b4",
    category: "Cultural"
  },
  {
    id: "google-campus",
    title: "Google Campus",
    location: "Mountain View, USA",
    year: 2022,
    description: "A sustainable and innovative headquarters featuring a tent-like canopy roof.",
    image: "https://images.unsplash.com/photo-1554793000-245d3a3c2a51",
    category: "Office"
  }
];
