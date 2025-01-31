export interface Project {
  id: string;
  title: string;
  location: string;
  year: number;
  description: string;
  image: string;
  images: string[]; // Add this array for multiple images
  category: string;
  metadata: string[];
}

export const projects: Project[] = [
  {
    id: "Corp0rate-Circus",
    title: "Corp0rate-Circus",
    location: "Capri, Italy",
    year: 2023,
    description: "For whom, no one knows nor cares, lies the designer forced to meet desires of disconected thoughts of corporate greed, I mean..., Uhh Thats akward that was for my creative Writing Course, Welcome to Italys Newest Attraction, the Great American Corporate Circus ",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289072/Circus_kaz4or.jpg",  // Updated Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289073/Circus2_jnfynq.jpg",  // Added comma here
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289071/Circus3_azussb.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289078/Circus4_c69anh.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289074/Circus5_rxn4zj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289176/Untitled-1_vozsjt.jpg", 
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289175/Untitled-12_mglonv.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289079/Circus8_xuryh8.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289076/Circus9_ecsu04.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289077/Circus10_xgnst0.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738289072/Circus11_wcabdr.jpg",
      ],
    category: "Project's",
    metadata: ["3rd Year", "Ben Penell","Rhino","Grasshopper"]
  },
  {
    id: "Loom Haus",
    title: "Loom Haus",
    location: "Blacksburg, Virginia",
    year: 2022,
    description: "Step right up, folks—behold Oasis & Loom! Where strands of inspiration, tangled daydreams, and even the occasional coffee-induced doodle come together in one gloriously oversized ball of yarn. Here in my second-year foray into waft and weft, I’ve spun an architectural tale so delightfully twisted, it’s practically begging you to wander its woven corridors. Don’t worry—no knitting needles required (though they are strongly encouraged).",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293955/Loom_Haus_wmrmis.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738294826/Loom_Haus22_b42xoq.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738294824/Loom_Haus222_h7cf3w.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738294826/Loom_Haus223_gm8umb.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293958/Loom_Haus5_iz1p6k.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293961/Loom_Haus6_dr8u0x.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293962/Loom_Haus7_g2buo5.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293958/Loom_Haus8_kulsfk.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738293963/Loom_Haus9_ssxa8r.jpg"
    ],
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
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1600607687920/proj_via_57_west.png"
    ],
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
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1600585153490/proj_serpentine.png"
    ],
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
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1520529890308/proj_lego_house.png"
    ],
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
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1554793000/proj_google_campus.png"
    ],
    category: "Office",
    metadata: ["2022", "Office"]
  }
];