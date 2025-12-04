import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { useToast } from "@/hooks/use-toast";

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

interface PrintfulFile {
  id: number;
  type: string;
  hash: string;
  url: string | null;
  filename: string;
  preview_url: string;
  thumbnail_url: string;
}

interface PrintfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  size: string;
  color: string;
  availability_status: string;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: PrintfulFile[];
}

interface ProductDetailResponse {
  code: number;
  result: {
    sync_product: PrintfulSyncProduct;
    sync_variants: PrintfulSyncVariant[];
  };
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

interface ColorOption {
  name: string;
  hex: string;
  variants: PrintfulSyncVariant[];
}

interface CartItem {
  variantId: number;
  syncVariantId: number;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

const categories: Category[] = ["ALL", "GARMENTS", "GRAPHICS", "OBJECTS", "STUDIES"];

const colorMap: Record<string, string> = {
  "graphite heather": "#5C5C5C",
  "black": "#1a1a1a",
  "white": "#ffffff",
  "navy": "#1a2b4a",
  "red": "#c41e3a",
  "royal": "#4169e1",
  "charcoal": "#36454f",
  "heather grey": "#9CA3AF",
  "sport grey": "#8B8B8B",
  "dark heather": "#4a4a4a",
  "light blue": "#ADD8E6",
  "maroon": "#800000",
  "military green": "#4B5320",
  "orange": "#FF6600",
  "pink": "#FFC0CB",
  "purple": "#800080",
  "sand": "#C2B280",
  "forest green": "#228B22",
  "gold": "#FFD700",
  "irish green": "#009A63",
  "natural": "#FAEBD7",
  "sapphire": "#0F52BA",
  "cardinal red": "#C41E3A",
  "daisy": "#FFE135",
  "heliconia": "#FF69B4",
  "ice grey": "#D3D3D3",
  "indigo blue": "#4B0082",
  "lime": "#32CD32",
  "carolina blue": "#56A0D3",
  "sunset": "#FAD6A5",
  "antique cherry red": "#CD5C5C",
  "antique sapphire": "#2A52BE",
  "dark chocolate": "#3D1E0F",
  "kiwi": "#8EE53F",
  "ash": "#B2BEB5",
  "cobalt": "#0047AB",
  "heather cardinal": "#CD5C5C",
  "heather navy": "#2C3E50",
  "heather sapphire": "#4169E1",
  "turf green": "#3CB371",
  "coral silk": "#FF7F7F",
  "electric green": "#00FF00",
  "gravel": "#837E7C",
};

function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase();
  return colorMap[normalized] || "#9CA3AF";
}

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

function extractVariantImages(variant: PrintfulSyncVariant | null, fallbackThumbnail: string): string[] {
  const images: string[] = [];
  if (!variant) return [fallbackThumbnail];
  
  const addedUrls = new Set<string>();
  const addImage = (url: string | null | undefined) => {
    if (url && !addedUrls.has(url)) {
      addedUrls.add(url);
      images.push(url);
    }
  };
  
  const previewFile = variant.files.find(f => f.type === "preview");
  addImage(previewFile?.preview_url);
  
  const defaultFile = variant.files.find(f => f.type === "default");
  addImage(defaultFile?.preview_url);
  
  const frontFile = variant.files.find(f => f.type === "front_dtf" || f.type === "front");
  addImage(frontFile?.preview_url);
  
  const backFile = variant.files.find(f => f.type === "back_dtf" || f.type === "back");
  addImage(backFile?.preview_url);
  
  const mockupFile = variant.files.find(f => f.type === "mockup");
  addImage(mockupFile?.preview_url);
  
  addImage(variant.product?.image);
  
  return images.length > 0 ? images : [fallbackThumbnail];
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
      <div className="sticky top-12">
        <h1 className="text-sm font-medium uppercase tracking-widest mb-4 text-foreground">
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
        focus:outline-none
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
        relative overflow-hidden bg-muted/30 transition-all duration-200
        ${isLarge ? "aspect-[3/4]" : "aspect-square"}
        group-hover:shadow-lg
      `}>
        <img
          src={product.thumbnail_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {isSelected && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-foreground rounded-full" />
        )}
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

function ColorSwatch({
  color,
  isSelected,
  onClick
}: {
  color: ColorOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hex = getColorHex(color.name);
  const isLight = hex === "#ffffff" || hex === "#FAEBD7" || hex === "#FAD6A5" || hex === "#FFE135";
  
  return (
    <button
      onClick={onClick}
      className={`
        relative w-8 h-8 rounded-full transition-all duration-150
        ${isSelected ? "ring-2 ring-offset-2 ring-foreground" : "hover:scale-110"}
        ${isLight ? "border border-gray-300" : ""}
      `}
      style={{ backgroundColor: hex }}
      title={color.name}
      aria-label={`Select ${color.name} color`}
    >
      {isSelected && (
        <span className={`absolute inset-0 flex items-center justify-center ${isLight ? "text-black" : "text-white"}`}>
          <Check className="w-4 h-4" />
        </span>
      )}
    </button>
  );
}

function SizeButton({
  size,
  isSelected,
  isAvailable,
  onClick
}: {
  size: string;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={`
        px-4 py-2 text-xs uppercase tracking-wide border transition-all duration-150
        ${isSelected 
          ? "bg-foreground text-background border-foreground" 
          : isAvailable
            ? "border-foreground/30 hover:border-foreground"
            : "border-muted text-muted-foreground line-through cursor-not-allowed opacity-50"
        }
      `}
      aria-label={`Select size ${size}${!isAvailable ? " (unavailable)" : ""}`}
    >
      {size}
    </button>
  );
}

function ImageCarousel({
  images,
  currentIndex,
  onPrev,
  onNext,
  enableZoom = false
}: {
  images: string[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  enableZoom?: boolean;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  
  if (images.length === 0) return null;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };
  
  return (
    <div 
      className="relative aspect-square bg-muted/30 rounded-lg overflow-hidden"
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt="Product preview"
          className="w-full h-full object-cover transition-transform duration-150"
          style={isZoomed ? {
            transform: 'scale(2.5)',
            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
          } : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      </AnimatePresence>
      
      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isZoomed && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {enableZoom && !isZoomed && (
        <div className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wide text-white/70 bg-black/30 px-2 py-1 rounded">
          Hover to zoom
        </div>
      )}
    </div>
  );
}

function StudioDetailPanel({
  product,
  cart,
  onAddToCart
}: {
  product: StudioProduct | null;
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
}) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  const { data: productDetail, isLoading: isLoadingDetail, error: detailError } = useQuery<ProductDetailResponse>({
    queryKey: ["/api/shop/products", product?.id],
    enabled: !!product?.id,
  });
  
  // Log for debugging
  useEffect(() => {
    if (product?.id && productDetail) {
      console.log(`Product ${product.id} detail:`, productDetail);
      console.log(`Sync variants:`, productDetail?.result?.sync_variants);
      console.log(`Number of variants:`, productDetail?.result?.sync_variants?.length || 0);
      if (productDetail?.result?.sync_product) {
        console.log(`Sync product info:`, productDetail.result.sync_product);
      }
    }
    if (detailError) {
      console.error(`Error loading product ${product?.id}:`, detailError);
    }
  }, [product?.id, productDetail, detailError]);
  
  const { colors, sizes, selectedVariant, variantImages } = useMemo(() => {
    if (!productDetail?.result?.sync_variants) {
      return { colors: [], sizes: [], selectedVariant: null, variantImages: [] };
    }
    
    const variants = productDetail.result.sync_variants;
    
    const colorMap = new Map<string, ColorOption>();
    variants.forEach(v => {
      if (!colorMap.has(v.color)) {
        colorMap.set(v.color, {
          name: v.color,
          hex: getColorHex(v.color),
          variants: []
        });
      }
      colorMap.get(v.color)!.variants.push(v);
    });
    const colorOptions = Array.from(colorMap.values());
    
    const currentColor = selectedColor || colorOptions[0]?.name;
    const colorVariants = colorMap.get(currentColor || "")?.variants || [];
    
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    const uniqueSizes = Array.from(new Set(colorVariants.map(v => v.size)));
    const sortedSizes = uniqueSizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    const currentSize = selectedSize && sortedSizes.includes(selectedSize) ? selectedSize : sortedSizes[0];
    const variant = colorVariants.find(v => v.size === currentSize) || colorVariants[0];
    
    return {
      colors: colorOptions,
      sizes: sortedSizes.map(size => ({
        size,
        available: colorVariants.some(v => v.size === size && v.availability_status === "active")
      })),
      selectedVariant: variant,
      variantImages: extractVariantImages(variant, product?.thumbnail_url || "")
    };
  }, [productDetail, selectedColor, selectedSize, product]);
  
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
  }, [colors, selectedColor]);
  
  useEffect(() => {
    if (sizes.length > 0) {
      const availableSize = sizes.find(s => s.available);
      if (availableSize && !selectedSize) {
        setSelectedSize(availableSize.size);
      }
    }
  }, [sizes, selectedSize]);
  
  useEffect(() => {
    setImageIndex(0);
  }, [selectedColor]);
  
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize) return;
    
    const item: CartItem = {
      variantId: selectedVariant.variant_id,
      syncVariantId: selectedVariant.id,
      name: product?.name || "",
      color: selectedVariant.color,
      size: selectedSize,
      price: parseFloat(selectedVariant.retail_price),
      quantity: 1,
      image: variantImages[0]
    };
    
    onAddToCart(item);
  };

  if (!product) {
    return (
      <motion.div
        className="hidden lg:block shrink-0"
        style={{ width: "300px" }}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="sticky top-20">
          <p className="text-sm text-muted-foreground">Select an item to view details</p>
        </div>
      </motion.div>
    );
  }

  const price = selectedVariant ? parseFloat(selectedVariant.retail_price) : 0;

  return (
    <motion.div
      className="hidden lg:block shrink-0"
      style={{ width: "300px" }}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="sticky top-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {isLoadingDetail ? (
              <div className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <p className="text-xs text-muted-foreground mt-2">Loading product details...</p>
              </div>
            ) : detailError ? (
              <div className="space-y-4">
                <p className="text-sm text-destructive">Failed to load product details</p>
                <p className="text-xs text-muted-foreground">Please try selecting another product</p>
              </div>
            ) : !productDetail?.result?.sync_variants ? (
              <div className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : productDetail.result.sync_variants.length === 0 ? (
              <div className="space-y-4">
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div>
                  <h2 className="text-base font-semibold uppercase tracking-wide mb-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">No variants available</p>
                </div>
              </div>
            ) : (
              <>
                <ImageCarousel
                  images={variantImages}
                  currentIndex={imageIndex}
                  onPrev={() => setImageIndex(i => i > 0 ? i - 1 : variantImages.length - 1)}
                  onNext={() => setImageIndex(i => i < variantImages.length - 1 ? i + 1 : 0)}
                  enableZoom={true}
                />
                
                <div>
                  <h2 className="text-base font-semibold uppercase tracking-wide mb-1">
                    {product.name}
                  </h2>
                  <p className="text-lg font-medium">
                    ${price.toFixed(2)}
                  </p>
                  {selectedVariant?.product?.name && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedVariant.product.name.split('|')[0]?.trim()}
                    </p>
                  )}
                </div>
                
                {colors.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      Color: {selectedColor}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <ColorSwatch
                          key={color.name}
                          color={color}
                          isSelected={selectedColor === color.name}
                          onClick={() => {
                            setSelectedColor(color.name);
                            setSelectedSize(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {sizes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      Size
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(({ size, available }) => (
                        <SizeButton
                          key={size}
                          size={size}
                          isSelected={selectedSize === size}
                          isAvailable={available}
                          onClick={() => setSelectedSize(size)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || !selectedSize}
                  className="w-full uppercase tracking-wide text-xs h-11"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Add to Cart - ${price.toFixed(2)}
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StudioMobileSheet({
  product,
  isOpen,
  onClose,
  onAddToCart
}: {
  product: StudioProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  const { data: productDetail, isLoading: isLoadingDetail, error: detailError } = useQuery<ProductDetailResponse>({
    queryKey: ["/api/shop/products", product?.id],
    enabled: !!product?.id && isOpen,
  });
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedColor(null);
      setSelectedSize(null);
      setImageIndex(0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { colors, sizes, selectedVariant, variantImages } = useMemo(() => {
    if (!productDetail?.result?.sync_variants) {
      return { colors: [], sizes: [], selectedVariant: null, variantImages: [] };
    }
    
    const variants = productDetail.result.sync_variants;
    
    const colorMap = new Map<string, ColorOption>();
    variants.forEach(v => {
      if (!colorMap.has(v.color)) {
        colorMap.set(v.color, {
          name: v.color,
          hex: getColorHex(v.color),
          variants: []
        });
      }
      colorMap.get(v.color)!.variants.push(v);
    });
    const colorOptions = Array.from(colorMap.values());
    
    const currentColor = selectedColor || colorOptions[0]?.name;
    const colorVariants = colorMap.get(currentColor || "")?.variants || [];
    
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    const uniqueSizes = Array.from(new Set(colorVariants.map(v => v.size)));
    const sortedSizes = uniqueSizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    const currentSize = selectedSize && sortedSizes.includes(selectedSize) ? selectedSize : sortedSizes[0];
    const variant = colorVariants.find(v => v.size === currentSize) || colorVariants[0];
    
    return {
      colors: colorOptions,
      sizes: sortedSizes.map(size => ({
        size,
        available: colorVariants.some(v => v.size === size && v.availability_status === "active")
      })),
      selectedVariant: variant,
      variantImages: extractVariantImages(variant, product?.thumbnail_url || "")
    };
  }, [productDetail, selectedColor, selectedSize, product]);
  
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
  }, [colors, selectedColor]);
  
  useEffect(() => {
    if (sizes.length > 0) {
      const availableSize = sizes.find(s => s.available);
      if (availableSize && !selectedSize) {
        setSelectedSize(availableSize.size);
      }
    }
  }, [sizes, selectedSize]);
  
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize) return;
    
    const item: CartItem = {
      variantId: selectedVariant.variant_id,
      syncVariantId: selectedVariant.id,
      name: product?.name || "",
      color: selectedVariant.color,
      size: selectedSize,
      price: parseFloat(selectedVariant.retail_price),
      quantity: 1,
      image: variantImages[0]
    };
    
    onAddToCart(item);
    onClose();
  };

  if (!product) return null;

  const price = selectedVariant ? parseFloat(selectedVariant.retail_price) : 0;

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
            className="fixed bottom-0 left-0 right-0 bg-background z-50 lg:hidden rounded-t-2xl max-h-[90vh] overflow-y-auto"
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
            <div className="p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <p className="text-xs text-muted-foreground">Loading details...</p>
                </div>
              ) : detailError ? (
                <div className="space-y-4">
                  <p className="text-sm text-destructive">Failed to load product details</p>
                </div>
              ) : !productDetail?.result?.sync_variants ? (
                <div className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : productDetail.result.sync_variants.length === 0 ? (
                <div className="space-y-4">
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">No variants available for this product</p>
                </div>
              ) : (
                <>
                  <ImageCarousel
                    images={variantImages}
                    currentIndex={imageIndex}
                    onPrev={() => setImageIndex(i => i > 0 ? i - 1 : variantImages.length - 1)}
                    onNext={() => setImageIndex(i => i < variantImages.length - 1 ? i + 1 : 0)}
                  />
                  
                  <div>
                    <p className="text-lg font-medium">
                      ${price.toFixed(2)}
                    </p>
                  </div>
                  
                  {colors.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                        Color: {selectedColor}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <ColorSwatch
                            key={color.name}
                            color={color}
                            isSelected={selectedColor === color.name}
                            onClick={() => {
                              setSelectedColor(color.name);
                              setSelectedSize(null);
                              setImageIndex(0);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sizes.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                        Size
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(({ size, available }) => (
                          <SizeButton
                            key={size}
                            size={size}
                            isSelected={selectedSize === size}
                            isAvailable={available}
                            onClick={() => setSelectedSize(size)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || !selectedSize}
                    className="w-full uppercase tracking-wide text-xs h-12"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart - ${price.toFixed(2)}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartDrawer({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckingOut
}: {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (syncVariantId: number, quantity: number) => void;
  onRemoveItem: (syncVariantId: number) => void;
  onCheckout: () => void;
  isCheckingOut?: boolean;
}) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
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
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-base font-semibold uppercase tracking-wide">
                  Cart ({cart.length})
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Your cart is empty
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.syncVariantId} className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.color} / {item.size}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onUpdateQuantity(item.syncVariantId, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center border rounded hover:bg-muted"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.syncVariantId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center border rounded hover:bg-muted"
                            >
                              +
                            </button>
                            <button
                              onClick={() => onRemoveItem(item.syncVariantId)}
                              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm uppercase tracking-wide">Total</span>
                    <span className="text-lg font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={onCheckout}
                    disabled={isCheckingOut}
                    className="w-full uppercase tracking-wide text-xs h-12"
                  >
                    {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                </div>
              )}
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true' && sessionId) {
      fetch(`/api/shop/checkout/${sessionId}/verify`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCart([]);
            setOrderSuccess(true);
            toast({
              title: "Order Placed!",
              description: "Thank you for your purchase. Your order is being processed.",
            });
          }
        })
        .catch(err => {
          console.error('Error verifying checkout:', err);
          toast({
            title: "Payment Received",
            description: "Your payment was successful. We're processing your order.",
          });
        })
        .finally(() => {
          window.history.replaceState({}, '', '/studio');
        });
    } else if (canceled === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "Your checkout was canceled. Your cart items are still saved.",
      });
      window.history.replaceState({}, '', '/studio');
    }
  }, [toast]);

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
  
  const handleAddToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.syncVariantId === item.syncVariantId);
      if (existing) {
        return prev.map(i => 
          i.syncVariantId === item.syncVariantId 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, item];
    });
    toast({
      title: "Added to cart",
      description: `${item.name} - ${item.color} / ${item.size}`,
    });
  }, [toast]);
  
  const handleUpdateQuantity = useCallback((syncVariantId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      item.syncVariantId === syncVariantId 
        ? { ...item, quantity }
        : item
    ));
  }, []);
  
  const handleRemoveItem = useCallback((syncVariantId: number) => {
    setCart(prev => prev.filter(item => item.syncVariantId !== syncVariantId));
  }, []);
  
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cart }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "There was a problem starting checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, toast]);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <header className="fixed top-0 left-0 right-0 z-50 p-5 flex justify-between items-start">
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
        
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
          onClick={() => setCartOpen(true)}
          className="relative p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Open cart"
        >
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </motion.button>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 pl-8 lg:pl-12">
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
            cart={cart}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      <StudioMobileSheet
        product={selectedProduct}
        isOpen={mobileSheetOpen}
        onClose={handleCloseMobileSheet}
        onAddToCart={handleAddToCart}
      />
      
      <CartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
}
