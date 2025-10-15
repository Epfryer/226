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
    year: 2021,
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
    category: "Competition",
    metadata: ["2023", "Cultural"]
  },
  {
    id: "Behind The Curtain",
    title: "Behind The Curtain",
    location: " Milwaukee Ave,Chicago",
    year: 2024,
    description: "For the Spring 2024 Chicago Studio, my partner  Spencer Schmalzried and I were tasked with transforming a vacant site in Logan Square into a 100-unit mixed-use affordable housing complex and cultural venue along the future “Milwaukee Cultural Corridor.” Rooted in the concept of the “curtain” as a threshold between public and private, our design blends residential, commercial, and cultural spaces. The project features low-rise housing, a 10,000-square-foot music school, and 3,000 square feet of commercial space to support local businesses. The narrative unfolds through three courtyards: a resident-focused sanctuary with a gym, daycare, and co-working spaces; a public plaza hosting markets and art installations; and a performance courtyard with an amphitheater for music recitals. Inspired by the Congress Theatre and Concord Music Hall, “Behind the Curtain” blurs the line between performance and daily life, fostering a vibrant community where creativity and connection thrive.",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545517/Chicago_Studio_vr1pa4.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545517/Chicago_Studio2_ubx9jm.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545527/Chicago_Studio3_i71ebw.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545518/Chicago_Studio4_uk2mgs.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545526/Chicago_Studio5_mpv0qs.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545532/Chicago_Studio6_pdjlcx.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545518/Chicago_Studio7_akxl0b.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545520/Chicago_Studio8_rdvudt.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545519/Chicago_Studio9_evol99.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545520/Chicago_Studio10_w8cewq.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545527/Chicago_Studio11_swvicj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545528/Chicago_Studio12_ejlmaj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545520/Chicago_Studio13_jplw1l.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545521/Chicago_Studio14_pott1v.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545528/Chicago_Studio15_npwfmi.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545732/Chicago_Studio_16_gdnw8g.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545521/Chicago_Studio17_aithln.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545523/Chicago_Studio18_labyxt.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545522/Chicago_Studio19_fmsf7x.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545532/Chicago_Studio20_kstp56.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545523/Chicago_Studio21_fz90d8.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545529/Chicago_Studio22_vyxclc.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545524/Chicago_Studio23_mgpbia.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545530/Chicago_Studio24_vilnfh.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545530/Chicago_Studio25_hvek32.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545531/Chicago_Studio26_j0g3bm.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545530/Chicago_Studio27_ulij5b.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545524/Chicago_Studio28_snjojp.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545516/Chicago_Studio29_bgvnzv.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545516/Chicago_Studio30_sdn7fc.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545516/Chicago_Studio31_peufgi.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545524/Chicago_Studio32_rcjw1p.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545516/Chicago_Studio33_kmn6ju.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545531/Chicago_Studio34_ha5lmm.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545517/Chicago_Studio35_pg690o.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545525/Chicago_Studio36_obs9rg.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545517/Chicago_Studio37_tr6tgq.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760545524/Chicago_Studio38_qftm3c.jpg",
    ],
    category: "Academic",
    metadata: ["2017", "Cultural"]
  },
  {
    id: "thesis",
    title: "The 78",
    location: "Southside, Chciago",
    year: 2025,
    description: "This thesis challenges the rigidity of the Cartesian Grid by proposing a shift toward a Dynamic use of euclidean Space, allowing urban circulation to evolve beyond static corridors into a meandering, adaptive network. This model fosters organic interactions within public transportation and infrastructure, breaking the reliance on rigid zoning and fixed hierarchies.The 78 project applies this Framework of Dynamic Bridges, redistributing urban density and freeing the tower from its traditional role as the city’s sole vertical icon. By interweaving public and private realms across multiple planes, the city streets transforms into a fluid, Urban model rather than a collection of isolated structures. As architecture embraces dynamic adaptability, the city of the future may not just be built, but animated like the grand narratives once confined to Hollywood’s silver screen",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF_iqucdo.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548949/Thesis_DEF2_iznfp4.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548952/Thesis_DEF3_tetgvj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548951/Thesis_DEF4_svw7gw.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548952/Thesis_DEF5_qlltxr.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF6_avinls.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548949/Thesis_DEF7_r2nqck.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548953/Thesis_DEF8_xlbxlw.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548953/Thesis_DEF9_wzrjmh.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF10_fmpbzj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF11_bpqtoz.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548951/Thesis_DEF12_puffct.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548951/Thesis_DEF13_qunelj.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548953/Thesis_DEF14_enzvs5.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548954/Thesis_DEF15_eq2bqb.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548952/Thesis_DEF16_p3ihag.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548954/Thesis_DEF17_doakep.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548953/Thesis_DEF18_ctwq1x.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548949/Thesis_DEF19_tpbka9.jpg",
    ],
    category: "Academic",
    metadata: ["2022", "Office"]
  },
  {
    id: "AIA Comp",
    title: "AIA Virgina BauthHaus",
    location: "Alexandria, Virginia",
    year: 2025,
    description: "This thesis challenges the rigidity of the Cartesian Grid by proposing a shift toward a Dynamic use of euclidean Space, allowing urban circulation to evolve beyond static corridors into a meandering, adaptive network. This model fosters organic interactions within public transportation and infrastructure, breaking the reliance on rigid zoning and fixed hierarchies.The 78 project applies this Framework of Dynamic Bridges, redistributing urban density and freeing the tower from its traditional role as the city’s sole vertical icon. By interweaving public and private realms across multiple planes, the city streets transforms into a fluid, Urban model rather than a collection of isolated structures. As architecture embraces dynamic adaptability, the city of the future may not just be built, but animated like the grand narratives once confined to Hollywood’s silver screen",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF_iqucdo.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548949/Thesis_DEF2_iznfp4.jpg",
    ],
    category: "Competition",
    metadata: ["2025", "Office"]
  },
  {
    id: "Chicago Stu",
  title: "4th Year Competition",
  location: "Southside, Chciago",
  year: 2025,
  description: "	Tasked with creating 100 affordable housing units, the project site is in the Logan Square neighborhood in Chicago along the 'Milwaukee Cultural Corridor 'situated between the Concord Music Hall and Congress Theater. The project sits on a vast, undeveloped lot in this cultural corridor, a hole in the urban fabric waiting to be engaged. The two historic venues are pulling from both sides, creating a stage for the public between them, opening the curtain on the new development so the public can experience the space behind it. The concept of “Behind the Curtain” draws inspiration from the historical transition of form and function embodied by curtains. Initially serving as practical dividers, curtains evolved into symbols of anticipation and spectacle, embodying the essence of revelation. This evolution mirrors the architectural journey from mere structural necessity to expressive artistry.
",
  image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557821/ChistuBoards_nsdyia.jpg",  // Updated to Cloudinary URL
  images: [
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557821/ChistuBoards2_jrfhdp.jpg",
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557822/ChistuBoards3_iy82ff.jpg",
  ],
  category: "Competition",
  metadata: ["2024", "Office"]
},
{
  id: "International Comp",
  title: "House Of light & Shadows",
  location: "New Mexico",
  year: 2025,
  description: "This thesis challenges the rigidity of the Cartesian Grid by proposing a shift toward a Dynamic use of euclidean Space, allowing urban circulation to evolve beyond static corridors into a meandering, adaptive network. This model fosters organic interactions within public transportation and infrastructure, breaking the reliance on rigid zoning and fixed hierarchies.The 78 project applies this Framework of Dynamic Bridges, redistributing urban density and freeing the tower from its traditional role as the city’s sole vertical icon. By interweaving public and private realms across multiple planes, the city streets transforms into a fluid, Urban model rather than a collection of isolated structures. As architecture embraces dynamic adaptability, the city of the future may not just be built, but animated like the grand narratives once confined to Hollywood’s silver screen",
  image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF_iqucdo.jpg",  // Updated to Cloudinary URL
  images: [
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760548949/Thesis_DEF2_iznfp4.jpg",
  ],
  category: "Competition",
  metadata: ["2024", "Office"]
}
];