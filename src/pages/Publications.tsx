
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PUBLICATIONS, type Publication } from "@/data/publications";
import { PublicationCard } from "@/components/PublicationCard";
import { PdfModal } from "@/components/PdfModal";

export default function Publications() {
  const [location, setLocation] = useLocation();
  const [selectedPub, setSelectedPub] = useState<Publication | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse query parameter
  const getDocSlug = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("doc");
  };

  // Handle opening publication
  const handleOpenPub = (pub: Publication) => {
    setSelectedPub(pub);
    setIsModalOpen(true);
    window.history.pushState({}, "", `?doc=${pub.slug}`);
  };

  // Handle closing modal
  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedPub(undefined);
    window.history.pushState({}, "", window.location.pathname);
  };

  // Check for deep link on mount
  useEffect(() => {
    const docSlug = getDocSlug();
    if (docSlug) {
      const pub = PUBLICATIONS.find((p) => p.slug === docSlug);
      if (pub) {
        setSelectedPub(pub);
        setIsModalOpen(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Publications</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            A collection of research papers, portfolios, and architectural documentation
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLICATIONS.map((pub) => (
            <PublicationCard key={pub.slug} pub={pub} onOpen={handleOpenPub} />
          ))}
        </div>

        {/* Empty state */}
        {PUBLICATIONS.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            <p>No publications available yet.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <PdfModal open={isModalOpen} pub={selectedPub} onClose={handleClose} />
    </div>
  );
}
