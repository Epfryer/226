
export interface Publication {
  slug: string;
  title: string;
  year: string;
  pdfPath: string;
  coverPath?: string;
  filename?: string;
}

// This will be populated from the API
export let PUBLICATIONS: Publication[] = [];

// Function to fetch publications from the API
export async function fetchPublications(): Promise<Publication[]> {
  try {
    // In production, the API is served from the same origin
    // In development, Vite proxies /api requests to the backend
    const apiUrl = '/api/publications';
    
    const response = await fetch(apiUrl, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch publications');
    }
    
    const data = await response.json();
    
    // Map the publications and add cover paths
    PUBLICATIONS = data.publications.map((pub: Publication) => {
      // Extract a better title from filename if metadata title is missing or generic
      let displayTitle = pub.title;
      if (!displayTitle || displayTitle === 'C' || displayTitle === pub.filename) {
        // Convert filename to readable title: "EthanFryer_Hybrid-Urbanism.pdf" -> "Hybrid Urbanism"
        displayTitle = pub.filename
          ?.replace('.pdf', '')
          .split('_')
          .slice(1) // Remove the "EthanFryer" prefix
          .join(' ')
          .replace(/-/g, ' ') || pub.title;
      }
      
      // Handle cover path - map special cases for the new publications
      let coverPath = `/publications/${pub.filename?.replace('.pdf', '.jpg') || pub.slug + '.jpg'}`;
      
      // Special mapping for Nature's Transcendence which has "_Page" suffix in the cover
      if (pub.filename?.includes('Natures_Transcendence_ICR')) {
        coverPath = '/publications/EthanFryer_Natures_Transcendence_ICR_Page.jpg';
      }
      // Special mapping for European Travel which may have a space in the filename
      else if (pub.filename?.includes('European_Travel') || pub.filename?.includes('European Travel')) {
        coverPath = '/publications/EthanFryer_European_Travel_Research_Paper.jpg';
      }
      
      return {
        ...pub,
        title: displayTitle,
        coverPath
      };
    });
    
    return PUBLICATIONS;
  } catch (error) {
    console.error('Error fetching publications:', error);
    // Fallback to static data if API fails
    PUBLICATIONS = [
      {
        slug: "ethan-fryer-hybrid-urbanism",
        title: "Hybrid Urbanism",
        year: "2025",
        pdfPath: "/api/publications/EthanFryer_Hybrid-Urbanism.pdf",
        coverPath: "/publications/EthanFryer_Hybrid-Urbanism.jpg"
      },
      {
        slug: "5th-year-selected-works",
        title: "5th Year Selected Works",
        year: "2024",
        pdfPath: "/api/publications/EthanFryer_5thYear_SelectedWorks.pdf",
        coverPath: "/publications/EthanFryer_5thYear_SelectedWorks.jpg"
      }
    ];
    return PUBLICATIONS;
  }
}
