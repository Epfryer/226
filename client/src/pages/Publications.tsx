import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PublicationCard } from "@/components/PublicationCard";
import { PdfModal } from "@/components/PdfModal";
import { PUBLICATIONS, type Publication } from "@/data/publications";

export default function Publications() {
  const [location, setLocation] = useLocation();
  const [selectedPub, setSelectedPub] = useState<Publication | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docSlug = params.get("doc");
    
    if (docSlug) {
      const pub = PUBLICATIONS.find(p => p.slug === docSlug);
      if (pub) {
        setSelectedPub(pub);
        setIsModalOpen(true);
      }
    }
  }, []);

  const handleOpenPub = (pub: Publication) => {
    setSelectedPub(pub);
    setIsModalOpen(true);
    
    const newUrl = `/publications?doc=${pub.slug}`;
    window.history.pushState({}, "", newUrl);
  };

  const handleClosePub = () => {
    setIsModalOpen(false);
    setSelectedPub(undefined);
    
    window.history.pushState({}, "", "/publications");
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const docSlug = params.get("doc");
      
      if (docSlug) {
        const pub = PUBLICATIONS.find(p => p.slug === docSlug);
        if (pub) {
          setSelectedPub(pub);
          setIsModalOpen(true);
        }
      } else {
        setIsModalOpen(false);
        setSelectedPub(undefined);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Publications</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore my academic work, research papers, and architectural theses. 
            Click any publication to view it in an interactive PDF reader.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLICATIONS.map((pub) => (
            <PublicationCard key={pub.slug} pub={pub} onOpen={handleOpenPub} />
          ))}
        </div>

        {PUBLICATIONS.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No publications available yet. Check back soon!
            </p>
          </div>
        )}
      </div>

      <PdfModal open={isModalOpen} pub={selectedPub} onClose={handleClosePub} />
    </div>
  );
}
