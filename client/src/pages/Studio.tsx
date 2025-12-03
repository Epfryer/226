import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingAnimation } from "@/components/ui/typing-animation";

type Category = "ALL" | "GARMENTS" | "GRAPHICS" | "OBJECTS" | "STUDIES";

interface StudioProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
  category?: Category;
  material?: string;
  intent?: string;
  price?: number;
  images?: string[];
}

interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url?: string;
  is_ignored: boolean;
}

interface PrintfulApiResponse {
  code: number;
  result: PrintfulSyncProduct[];
  extra?: any[];
  paging?: {
    total: number;
    offset: number;
    limit: number;
  };
}

const categories: Category[] = ["ALL", "GARMENTS", "GRAPHICS", "OBJECTS", "STUDIES"];

function categorizeProduct(name: string): Category {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("shirt") || lowerName.includes("hoodie") || lowerName.includes("jacket") || lowerName.includes("pants") || lowerName.includes("hat") || lowerName.includes("cap") || lowerName.includes("beanie") || lowerName.includes("sweater") || lowerName.includes("tee") || lowerName.includes("apparel")) {
    return "GARMENTS";
  }
  if (lowerName.includes("poster") || lowerName.includes("print") || lowerName.includes("canvas") || lowerName.includes("art") || lowerName.includes("photo") || lowerName.includes("wall")) {
    return "GRAPHICS";
  }
  if (lowerName.includes("mug") || lowerName.includes("bottle") || lowerName.includes("bag") || lowerName.includes("pillow") || lowerName.includes("blanket") || lowerName.includes("coaster") || lowerName.includes("phone") || lowerName.includes("case")) {
    return "OBJECTS";
  }
  return "STUDIES";
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function StudioSidebar({ 
  selectedCategory, 
  onCategoryChange 
}: { 
  selectedCategory: Category; 
  onCategoryChange: (category: Category) => void;
}) {
  return (
    <motion.aside 
      className="hidden lg:flex flex-col shrink-0"
      style={{ width: "180px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="sticky top-32">
        <h1 className="text-sm font-medium uppercase tracking-widest mb-8 text-foreground">
          Studio
        </h1>
        <nav className="flex flex-col space-y-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                text-left text-sm uppercase tracking-wide transition-all duration-150
                ${selectedCategory === category 
                  ? "text-foreground font-medium border-l-2 border-foreground pl-3 -ml-[2px]" 
                  : "text-muted-foreground hover:text-foreground pl-0"
                }
              `}
              aria-selected={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
}

function StudioMobileCategories({
  selectedCategory,
  onCategoryChange
}: {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}) {
  return (
    <div className="lg:hidden mb-8">
      <h1 className="text-sm font-medium uppercase tracking-widest mb-4 text-foreground">
        Studio
      </h1>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              px-4 py-2 text-xs uppercase tracking-wide whitespace-nowrap rounded-full border transition-all duration-150 shrink-0
              ${selectedCategory === category 
                ? "bg-foreground text-background border-foreground" 
                : "bg-transparent text-muted-foreground border-muted hover:border-foreground hover:text-foreground"
              }
            `}
            aria-selected={selectedCategory === category}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

function StudioGridItem({
  product,
  isSelected,
  onSelect,
  index
}: {
  product: StudioProduct;
  isSelected: boolean;
  onSelect: (product: StudioProduct) => void;
  index: number;
}) {
  const isLarge = index % 5 === 0 || index % 7 === 0;

  return (
    <motion.button
      className={`
        studio-item relative group cursor-pointer text-left w-full
        ${isLarge ? "row-span-2" : ""}
        ${isSelected ? "ring-1 ring-foreground" : ""}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2
      `}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.22, 
        ease: "easeOut",
        delay: Math.min(index * 0.05, 0.4)
      }}
      onClick={() => onSelect(product)}
      whileHover={{ y: -3 }}
    >
      <div className={`
        relative overflow-hidden bg-muted/30 transition-shadow duration-200
        ${isLarge ? "aspect-[3/4]" : "aspect-square"}
        group-hover:shadow-lg group-focus-visible:shadow-lg
      `}>
        <img
          src={product.thumbnail_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] uppercase tracking-wider text-white font-medium">
            {product.name}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function StudioGrid({
  products,
  selectedProduct,
  onSelectProduct,
  isLoading
}: {
  products: StudioProduct[];
  selectedProduct: StudioProduct | null;
  onSelectProduct: (product: StudioProduct) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-min">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={`${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No products available in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-min">
      <AnimatePresence mode="wait">
        {products.map((product, index) => (
          <StudioGridItem
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={onSelectProduct}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function StudioDetailPanel({
  product
}: {
  product: StudioProduct | null;
}) {
  if (!product) {
    return (
      <motion.div 
        className="hidden lg:block shrink-0"
        style={{ width: "300px" }}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="sticky top-24">
          <p className="text-sm text-muted-foreground">Select an item to view details</p>
        </div>
      </motion.div>
    );
  }

  const price = product.price || 45.00;
  const material = product.material || "Premium Materials";
  const intent = product.intent || "Crafted with intention, each piece represents a study in form and function. Designed to move seamlessly between contexts while maintaining its architectural presence.";

  return (
    <motion.div 
      className="hidden lg:block shrink-0"
      style={{ width: "300px" }}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="sticky top-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h2 className="text-base font-semibold uppercase tracking-wide mb-2">
              {product.name}
            </h2>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-6">
              {material}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed mb-8">
              {intent}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              ${price.toFixed(2)}
            </p>
            <Button 
              variant="outline" 
              className="w-full uppercase tracking-wide text-xs h-11 border-foreground/20 hover:bg-foreground/5"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StudioMobileSheet({
  product,
  isOpen,
  onClose
}: {
  product: StudioProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!product) return null;

  const price = product.price || 45.00;
  const material = product.material || "Premium Materials";
  const intent = product.intent || "Crafted with intention, each piece represents a study in form and function. Designed to move seamlessly between contexts while maintaining its architectural presence.";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-background z-50 lg:hidden rounded-t-2xl max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold uppercase tracking-wide">
                {product.name}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close product details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-square w-full mb-6 bg-muted/30 rounded-lg overflow-hidden">
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">
                {material}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                {intent}
              </p>
              <p className="text-lg font-medium mb-6">
                ${price.toFixed(2)}
              </p>
              <Button 
                className="w-full uppercase tracking-wide text-xs h-12"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Studio() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<StudioProduct | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { data: apiResponse, isLoading, error } = useQuery<PrintfulApiResponse>({
    queryKey: ["/api/shop/products"],
  });

  const products: StudioProduct[] = useMemo(() => {
    const rawProducts = apiResponse?.result;
    if (!rawProducts || !Array.isArray(rawProducts)) return [];
    return rawProducts.map(p => ({
      id: p.id,
      external_id: p.external_id,
      name: p.name,
      variants: p.variants,
      synced: p.synced,
      thumbnail_url: p.thumbnail_url || `https://picsum.photos/seed/${p.id}/400/400`,
      is_ignored: p.is_ignored,
      category: categorizeProduct(p.name),
      material: "Premium Materials",
      intent: "Crafted with intention, each piece represents a study in form and function.",
      price: 45.00
    }));
  }, [apiResponse]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  useEffect(() => {
    if (filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [filteredProducts, selectedProduct]);

  const handleCategoryChange = useCallback((category: Category) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
  }, []);

  const handleSelectProduct = useCallback((product: StudioProduct) => {
    setSelectedProduct(product);
    if (!isDesktop) {
      setMobileSheetOpen(true);
    }
  }, [isDesktop]);

  const handleCloseMobileSheet = useCallback(() => {
    setMobileSheetOpen(false);
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-16">
      <header className="fixed top-0 left-0 z-50 p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            delay: 0.2
          }}
        >
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <div className="flex items-center gap-2">
              <span className="text-sm font-light">Designed by</span>
              <span className="text-base font-bold">
                <TypingAnimation text="Ethan Fryer" speed={50} delay={200} />
              </span>
            </div>
          </Link>
        </motion.div>
      </header>
      <div className="max-w-7xl mx-auto px-6">
        <StudioMobileCategories 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        <div className="flex gap-8 lg:gap-12">
          <StudioSidebar 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          <main className="flex-1 min-w-0" role="main" aria-label="Product gallery">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <StudioGrid
                  products={filteredProducts}
                  selectedProduct={selectedProduct}
                  onSelectProduct={handleSelectProduct}
                  isLoading={isLoading}
                />
              </motion.div>
            </AnimatePresence>
          </main>

          <StudioDetailPanel 
            product={selectedProduct}
          />
        </div>
      </div>

      <StudioMobileSheet
        product={selectedProduct}
        isOpen={mobileSheetOpen}
        onClose={handleCloseMobileSheet}
      />
    </div>
  );
}