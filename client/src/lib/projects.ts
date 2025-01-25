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
    id: "Corp0rate-Circus",
    title: "Corp0rate-Circus",
    location: "Capri, Italy",
    year: "3rd Year B.arch Final",
    description: "For whom, no one knows nor cares, lies the designer forced to meet desires of disconected thoughts of corporate greed, I mean..., Uhh Thats akward that was for my creative Writing Course, Welcome to Italys Newest Attraction, the Great American Corporate Circus ",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1737825039/proj_304_c5eccf.png",  // Updated Cloudinary URL
    category: "Project's",
    metadata: ["3rd Year", "Ben Penell","Rhino","Grasshopper"]
  },
  {
    id: "Loom Haus",
    title: "Loom Haus",
    location: "Blacksburg, Virginia",
    year: 2010,
    description: "A mixed-use development in the shape of a figure 8, featuring apartments, offices and retail.",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1737831615/Stab_.1.12_wb6rua.png",  // Updated to Cloudinary URL
    category: "Residential",
    metadata: ["2010", "Residential"]
  },
  {
    id: "via-57-west",
    title: "VIA 57 West",
    location: "New York, USA",
    year: 2016,
    description: "A hybrid between the European perimeter block and a traditional Manhattan high-rise.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1600607687920/proj_via_57_west.png",  // Updated to Cloudinary URL
    category: "Residential",
    metadata: ["2016", "Residential"]
  },
  {
    id: "serpentine",
    title: "Serpentine Pavilion",
    location: "London, UK",
    year: 2016,
    description: "A temporary pavilion design featuring an 'unzipped wall' transformed into a space for gathering.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1600585153490/proj_serpentine.png",  // Updated to Cloudinary URL
    category: "Cultural",
    metadata: ["2016", "Cultural"]
  },
  {
    id: "lego-house",
    title: "LEGO House",
    location: "Billund, Denmark",
    year: 2017,
    description: "A experience center and gathering point for LEGO fans of all ages.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1520529890308/proj_lego_house.png",  // Updated to Cloudinary URL
    category: "Cultural",
    metadata: ["2017", "Cultural"]
  },
  {
    id: "google-campus",
    title: "Google Campus",
    location: "Mountain View, USA",
    year: 2022,
    description: "A sustainable and innovative headquarters featuring a tent-like canopy roof.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1554793000/proj_google_campus.png",  // Updated to Cloudinary URL
    category: "Office",
    metadata: ["2022", "Office"]
  }
];