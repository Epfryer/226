export interface Project {
  id: string;
  title: string;
  location: string;
  year: number;
  description: string;
  image: string;
  imageAlt: string;
  images: string[]; // Add this array for multiple images
  imageAlts: string[];
  category: string;
  metadata: string[];
}

export const projects: Project[] = [
  {
    id: "Corp0rate-Circus",
    imageAlt: "Corp0rate-Circus: collage of tilted towers, advertising signs, a classical statue, and a yellow taxi.",
    imageAlts: [
      "Corp0rate-Circus: tower and tent form studies above a rocky island section.",
      "Corp0rate-Circus: dark island silhouettes with a central opening and sheer cliffs.",
      "Corp0rate-Circus: cutaway perspectives of a stacked tower on a flared tent-like base.",
      "Corp0rate-Circus: illustrated breakdown of the tower, base, lobby, market, and performance spaces.",
      "Corp0rate-Circus: monochrome collages of a skeletal tower and layered public spaces.",
      "Corp0rate-Circus: section collage combining ramps, platforms, and fragmented landscape imagery.",
      "Corp0rate-Circus: contrasting monochrome landscape fragments and colorful commercial tower collages.",
      "Corp0rate-Circus: restaurant scenes mixing classical figures, advertising, and fast-food imagery.",
      "Corp0rate-Circus: dining-room and waterfront collages with oversized fast-food logos.",
      "Corp0rate-Circus: social-media post showing an ornate table setting with a caption about architecture and wealth."
    ],
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
    imageAlt: "Oasis & Loom: aerial rendering of a curved, timber-framed pavilion inserted between downtown buildings.",
    imageAlts: [
      "Oasis & Loom: aerial site plan with an oval pavilion and green pedestrian paths.",
      "Oasis & Loom: existing street photographs beside a site section with neighboring buildings and trees.",
      "Oasis & Loom: section rendering through the pavilion's curved timber roof and lower level.",
      "Oasis & Loom: circular floor plans and diagrams developing a looped building form.",
      "Oasis & Loom: sectional perspective, overhead site view, and interior studies of the timber structure.",
      "Oasis & Loom: interior stair and hall renderings beside photographs of curved study models.",
      "Oasis & Loom: pale wireframe perspective of intersecting curved roof ribs.",
      "Oasis & Loom: studio exhibition of drawings, presentation boards, and physical models."
    ],
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
    imageAlt: "Sculpture of Home: forest elevation with a circular opening above a sunken sculpture court.",
    imageAlts: [
      "Sculpture of Home: physical model with an exposed blue roof frame over a curved basin.",
      "Sculpture of Home: elongated floor plan, forest site plan, and section through a sculpture niche.",
      "Sculpture of Home: colored forest elevation with a blue glazed pavilion above a dark concrete basin.",
      "Sculpture of Home: sketchbook studies of the circular opening, trees, and sunken sculpture court.",
      "Sculpture of Home: design sketches and a shaded forest elevation of the two-level pavilion.",
      "Sculpture of Home: exhibition drawings and photographs of a curved timber study model.",
      "Sculpture of Home: dancer sculpture reference beside a close-up view through the timber model."
    ],
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
    imageAlt: "Bike Hub squared: cyclists approach a low pavilion and sunken courtyard on Cowgill Lawn.",
    imageAlts: [
      "Bike Hub squared: courtyard rendering with curved concrete seating and a timber-finned upper pavilion.",
      "Bike Hub squared: interior cafe rendering beside a circular program diagram and building section.",
      "Bike Hub squared: bicycle-inspired circular form diagrams and stepped building section.",
      "Bike Hub squared: competition boards combining courtyard renderings, bicycle diagrams, and sections."
    ],
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
    imageAlt: "Behind the Curtain: aerial photograph along Milwaukee Avenue toward the Chicago skyline.",
    imageAlts: [
      "Behind the Curtain: concept collage of a crowd facing a raised curtain between music venues.",
      "Behind the Curtain: project background with Chicago context maps and neighborhood diagrams.",
      "Behind the Curtain: historical neighborhood analysis with maps and photographs of local venues and murals.",
      "Behind the Curtain: performance-space references and missing-middle housing analysis.",
      "Behind the Curtain: site diagrams and plan showing buildings arranged around courtyards.",
      "Behind the Curtain: preliminary design studies using curtain shapes, overlapping circles, and massing diagrams.",
      "Behind the Curtain: development sequence of building masses, roof forms, and courtyard plans.",
      "Behind the Curtain: exploded program diagram separating housing, community, daycare, retail, and music spaces.",
      "Behind the Curtain: street-level rendering of the curved music venue and public plaza.",
      "Behind the Curtain: courtyard rendering of dark, rippling facades surrounding planted outdoor space.",
      "Behind the Curtain: sidewalk view of timber-clad housing and an open passage toward the music venue.",
      "Behind the Curtain: courtyard view of housing blocks with curved balconies and a red stair.",
      "Behind the Curtain: Milwaukee Avenue perspective with housing framing a public entrance.",
      "Behind the Curtain: backyard, center, and public stage perspectives comparing the three courtyard settings.",
      "Behind the Curtain: sunset view across the development toward a large illuminated mural.",
      "Behind the Curtain: public-to-private circulation diagram and individual apartment layouts.",
      "Behind the Curtain: illuminated building cutaway showing stacked rooms and shared circulation.",
      "Behind the Curtain: curtain-inspired facade details beside a furnished residential section.",
      "Behind the Curtain: layered facade study and street elevation with trees and curved cladding.",
      "Behind the Curtain: aerial site model and street elevation of the housing and music venue.",
      "Behind the Curtain: enlarged furnished residential section beside floor plans.",
      "Behind the Curtain: apartment plan variations and an exploded diagram of residential units.",
      "Behind the Curtain: double-height lobby with a curved timber wall and patterned sunlight.",
      "Behind the Curtain: human-scale design study with an illuminated section and facade details.",
      "Behind the Curtain: sunlit lobby beneath a glazed roof and suspended circular ceiling elements.",
      "Behind the Curtain: interior atrium with curved balconies, stairs, and patterned roof shadows.",
      "Behind the Curtain: atrium perspective beside environmental site-analysis diagrams.",
      "Behind the Curtain: life-safety floor plan showing circulation and exit routes.",
      "Behind the Curtain: fire-protection floor plan with coverage zones.",
      "Behind the Curtain: accessibility floor plan with routes through the housing complex.",
      "Behind the Curtain: accessible apartment plan beside building-area and occupancy calculations.",
      "Behind the Curtain: structural plan showing the column grid and curved building edge.",
      "Behind the Curtain: parking plan with vehicle spaces and courtyard landscaping.",
      "Behind the Curtain: mechanical systems floor plan with service routes.",
      "Behind the Curtain: electrical floor plan with lighting and power symbols.",
      "Behind the Curtain: plumbing floor plan with fixture and pipe locations.",
      "Behind the Curtain: tabulated building-code and project compliance information."
    ],
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
    imageAlt: "The 78: urban interior rendering with elevated bridges, planted terraces, and a glazed canopy.",
    imageAlts: [
      "The 78: aerial Chicago skyline view with a tall illuminated tower.",
      "The 78: overhead master plan of intersecting bridges and buildings beside rail infrastructure.",
      "The 78: riverside elevation of layered buildings linked by elevated circulation.",
      "The 78: close exterior view of stacked glazed volumes and planted bridge decks.",
      "The 78: oblique exterior rendering of interconnected blocks beneath sweeping elevated routes.",
      "The 78: tall building section with repeated curved floor connections and a circulation diagram.",
      "The 78: detailed vertical section showing stacked floors and structural connections.",
      "The 78: paired views from a shaded opening toward a glazed courtyard and lawn.",
      "The 78: twisting tower study beside a cutaway through stacked interior spaces.",
      "The 78: left portion of a circular, terraced floor plan around a central hall.",
      "The 78: right portion of the circular floor plan with adjoining circulation and rooms.",
      "The 78: Chicago riverfront at sunset with a steel bridge and skyline towers.",
      "The 78: planted waterfront edge beneath stacked buildings and tall arched openings.",
      "The 78: sectional perspective through layered public spaces and a long-span roof.",
      "The 78: building section beside an aerial rendering of a sloped roof overlooking the river.",
      "The 78: aerial master-plan view of connected blocks, bridges, and landscaped terraces.",
      "The 78: aerial riverfront perspective with a broad sloping roof and elevated walkways.",
      "The 78: closing text contrasting an ideal animated portfolio with the static PDF format."
    ],
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
    imageAlt: "AIA Virginia BauthHaus: public bath presentation with modular pod plans and an illuminated street pavilion.",
    imageAlts: [
      "AIA Virginia BauthHaus: cutaway axonometric of a private bathing pod above its floor plan.",
      "AIA Virginia BauthHaus: hanging sign reading Coming Soon."
    ],
    title: "AIA Virgina BauthHaus",
    location: "Alexandria, Virginia",
    year: 2025,
    description: "Set within the urban fabric of Alexandria, Virginia, In the Pursuit of Life, Liberty & Happiness reimagines the public bath as a civic equalizer — a space where comfort, dignity, and access intersect. The project addresses disparities in hygiene infrastructure by designing modular, transparent bath units that prioritize visibility, safety, and autonomy. Each pod adapts between “Occupied” and “Unoccupied” states, symbolizing both privacy and public trust.The design layers equity, equality, and empathy into a spatial narrative — a sequence of accessible pods, reflective enclosures, and illuminated thresholds that operate as both functional infrastructure and social statement. At night, the architecture transforms into a glowing civic landmark, embodying the American ideals of Life, Liberty, and Happiness through the lens of equitable design.",
    image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760565962/AIA_Bauthaus_bey1te.jpg",  // Updated to Cloudinary URL
    images: [
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760565963/AIA_Bauthaus2_lz1x01.jpg",
      "https://res.cloudinary.com/dtxqagii0/image/upload/v1760565962/AIA_Bauthaus3_peys3p.jpg",
    ],
    category: "Competition",
    metadata: ["2025", "Office"]
  },
  {
    id: "Chicago Stu",
    imageAlt: "4th Year Competition: Behind the Curtain presentation board with site plans, housing sections, and courtyard renderings.",
    imageAlts: [
      "4th Year Competition: expanded Behind the Curtain board showing apartment plans, facade studies, and courtyard perspectives.",
      "4th Year Competition: studio presentation photograph beside architectural drawings and models."
    ],
  title: "4th Year Competition",
  location: "Milwaukee Ave,Chicago",
  year: 2025,
  description: "Tasked with creating 100 affordable housing units, the project site is in the Logan Square neighborhood in Chicago along the 'Milwaukee Cultural Corridor' situated between the Concord Music Hall and Congress Theater. The project sits on a vast undeveloped lot on this cultural corridor that has been a hole in the urban fabric waiting to be engaged with. The two historic venues are pulling from both sides, creating a stage between them for the public, opening the curtain of the new development to allow the public to experience the space behind the curtain. The concept of 'Behind the Curtain' draws inspiration from the historical transition of form and function embodied by curtains. Initially serving as practical dividers, curtains evolved into symbols of anticipation and spectacle, embodying the essence of revelation. This evolution mirrors the architectural journey from mere structural necessity to expressive artistry.",
  image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557821/ChistuBoards_nsdyia.jpg",
  images: [
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557821/ChistuBoards2_jrfhdp.jpg",
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760557822/ChistuBoards3_iy82ff.jpg",
  ],
  category: "Competition",
  metadata: ["2024", "Office"]
},
{
  id: "International Comp",
  imageAlt: "House of Light & Shadows: Teranova collage combining a desert dwelling, observatory, lunar landscape, and starry sky.",
  imageAlts: [
    "House of Light & Shadows: Teranova presentation linking an earth-sheltered home and a telescope beneath a moonlit sky.",
    "House of Light & Shadows: hanging sign reading Coming Soon."
  ],
  title: "House Of light & Shadows",
  location: "New Mexico",
  year: 2025,
  description: "With Noah Freedman, David Kitterman, and Nicholas Cabral, Teranova explores the dialogue between the terrestrial and celestial realms through a dwelling shared by a Navajo and an astronomer. The design bridges Earth and cosmos — one rooted in cultural heritage, the other in scientific exploration — creating a shared architecture of reflection and discovery. Drawing inspiration from Navajo cosmology and the astronomer’s gaze into the infinite, the project manifests as a dual habitat: one embedded within the landscape, the other oriented toward the stars. Together, they form a spatial continuum between observation and grounding — a poetic union of myth, science, and dwelling that celebrates humanity’s enduring pursuit of understanding our place in the universe.",
  image: "https://res.cloudinary.com/dtxqagii0/image/upload/v1760566433/Project_Shadows_vxel4r.jpg",  // Updated to Cloudinary URL
  images: [
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760566433/Project_Shadows2_m66ow1.jpg",
    "https://res.cloudinary.com/dtxqagii0/image/upload/v1760566432/Project_Shadows3_guflmi.jpg",
  ],
  category: "Competition",
  metadata: ["2024", "Office"]
}
];