import { useState, useEffect, lazy, Suspense } from "react";
import { PublicationCard } from "@/components/PublicationCard";
import { fetchPublications, type Publication } from "@/data/publications";

const PdfModal = lazy(() => import("@/components/PdfModal").then((module) => ({ default: module.PdfModal })));

function PdfModalFallback({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-6">
      <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-5 text-white shadow-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-white/60">Loading viewer</p>
        <p className="mt-3 text-base text-white/85">Preparing publication…</p>
      </div>
    </div>
  );
}

export default function Publications() {
  const [selectedPub, setSelectedPub] = useState<Publication | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublications().then((pubs) => {
      setPublications(pubs);
      setLoading(false);

      const params = new URLSearchParams(window.location.search);
      const docSlug = params.get("doc");

      if (docSlug) {
        const pub = pubs.find((item) => item.slug === docSlug);
        if (pub) {
          setSelectedPub(pub);
          setIsModalOpen(true);
        }
      }
    });
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
        const pub = publications.find((item) => item.slug === docSlug);
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
  }, [publications]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Publications</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Explore academic work, research papers, and architectural theses. The interactive viewer only loads when you open a publication.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">Loading publications...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-6 md:justify-start">
              {publications.map((pub) => (
                <PublicationCard key={pub.slug} pub={pub} onOpen={handleOpenPub} />
              ))}
            </div>

            {publications.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground">No publications available yet. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </div>

      <Suspense fallback={<PdfModalFallback open={isModalOpen} />}>
        <PdfModal open={isModalOpen} pub={selectedPub} onClose={handleClosePub} />
      </Suspense>
    </div>
  );
}
