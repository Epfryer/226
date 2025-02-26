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
    category: "Academic",
    metadata: ["3rd Year", "Ben Penell","Rhino","Grasshopper"]
  },
  {
    id: "OASIS & LOOM",
    title: "OASIS & LOOM",
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
    category: "Academic",
    metadata: ["2010", "Residential"]
  },
  {
    id: "SCULPTURE OF HOME",
    title: "SCULPTURE OF HOME",
    location: "Berlin, Germany",
    year: 2022,
    description: "In my second-year project, I drew on George Klobe’s evocative sculptures—‘The Dancer,’ ‘Dawn,’ and ‘Crying’—to create a serene, two-tiered rural sanctuary. Concrete, wood, and glass unite in a composition that symbolizes life’s transcendence: a grounded concrete basin below and an ethereal glass pavilion tucked amid towering pines above. Visitors enter under the graceful gaze of ‘The Dancer,’ encounter the solemnity of ‘Crying,’ and ascend toward the gentle glow of ‘Dawn’—an architectural journey that transforms raw emotion into spatial poetry.",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337829/Statue_Haus_nsmoxh.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337827/Statue_Haus2_rvwcqd.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337828/Statue_Haus3_xeep34.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337829/Statue_Haus4_uvl6f0.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337945/Statue_Haus1_nlesjf.jpg", 
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337944/Statue_Haus12_c4q60i.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337945/Statue_Haus13_u8f5xg.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738337829/Statue_Haus8_pzqz9v.jpg",
      ],
    category: "Academic",
    metadata: ["2016", "Residential"]
  },
  {
    id: "BIKE HUB",
    title: "BIKE HUB^2",
    location: "Cowgill Lawn,Virginia",
    year: 2023,
    description: "For the Virginia Tech Cowgill Hall bike hub competition, I distilled the essence of biking into architectural form. Integrating the sleek lines of a bicycle, I designed a dynamic structure housing essential amenities like a cafe and showers. This project pushed my boundaries in geometry and rendering, completed within an intense 48-hour time frame. It underscored the profound synthesis of form and function fundamental to architectural practice..",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1738343812/Bike_Hub_uxsk4l.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738343815/Bike_Hub2_hnq8be.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738343813/Bike_Hub3_enycv9.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738343815/Bike_Hub4_no3dfl.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1738343812/Bike_Hub5_dp8ebn.jpg"
    ],
    category: "Competiton",
    metadata: ["2023", "Cultural"]
  },
  {
    id: "Behind The Curtain",
    title: "Behind The Curtain",
    location: " Milwaukee Ave,Chicago",
    year: 2024,
    description: "For the Spring 2024 Chicago Studio, my partner  Spencer Schmalzried and I were tasked with transforming a vacant site in Logan Square into a 100-unit mixed-use affordable housing complex and cultural venue along the future “Milwaukee Cultural Corridor.” Rooted in the concept of the “curtain” as a threshold between public and private, our design blends residential, commercial, and cultural spaces. The project features low-rise housing, a 10,000-square-foot music school, and 3,000 square feet of commercial space to support local businesses. The narrative unfolds through three courtyards: a resident-focused sanctuary with a gym, daycare, and co-working spaces; a public plaza hosting markets and art installations; and a performance courtyard with an amphitheater for music recitals. Inspired by the Congress Theatre and Concord Music Hall, “Behind the Curtain” blurs the line between performance and daily life, fostering a vibrant community where creativity and connection thrive.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1520529890308/proj_lego_house.png",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1520529890308/proj_lego_house.png"
    ],
    category: "Academic",
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
    category: "Academic",
    metadata: ["2022", "Office"]
  },
  {
    id: "template-project",
    title: "Template",
    location: "n/a",
    year: 2022,
    description: "A sustainable and innovative headquarters featuring a tent-like canopy roof.",
    image: "https://res.cloudinary.com/your_cloud_name/image/upload/v1554793000/proj_google_campus.png",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/your_cloud_name/image/upload/v1554793000/proj_google_campus.png"
    ],
    category: "Acadmeic",
    metadata: ["2022", "Office"]
  }
];