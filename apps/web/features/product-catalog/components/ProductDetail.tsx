"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Share2, 
  Ruler,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star
} from "lucide-react";
import { Product } from "../types";
import { useProduct } from "../hooks/useProduct";
import { cn } from "@tasheen/ui";
import { Button } from "@tasheen/ui";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { imageKitUrl } from "@/lib/imagekit";
import { useProductReviews } from "../hooks/useProductReviews";
import { WriteReviewModal } from "./WriteReviewModal";
import { RestockAlertModal } from "./RestockAlertModal";
import { useCurrentIdentity } from "@/features/user-management/hooks/useCurrentIdentity";
import { useUserProfile } from "@/features/user-management/hooks/useUserProfile";
import { useAuth } from "@/providers/AuthProvider";

// Custom color helper for muted luxury finishes
const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase();
  if (normalized.includes("mocha") || normalized.includes("brown")) return "#7B5C4E";
  if (normalized.includes("hazelnut") || normalized.includes("tan")) return "#C59B76";
  if (normalized.includes("black")) return "#1A1A1A";
  if (normalized.includes("white") || normalized.includes("cream")) return "#F9F6F0";
  if (normalized.includes("gold")) return "#D4AF37";
  if (normalized.includes("silver")) return "#C0C0C0";
  if (normalized.includes("burgundy") || normalized.includes("bordeaux")) return "#5B1C2A";
  if (normalized.includes("emerald") || normalized.includes("green")) return "#0B4B32";
  if (normalized.includes("navy") || normalized.includes("blue")) return "#0F2042";
  if (normalized.includes("rose") || normalized.includes("pink")) return "#E8C5C8";
  if (normalized.includes("grey") || normalized.includes("stone")) return "#969696";
  if (normalized.includes("purple") || normalized.includes("plum")) return "#5B3766";
  return "#D7C4B7"; // elegant fallback
};

export function ProductDetail({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("description");
  
  const { addToWishlist, isLoading: isLoadingWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [shakeSizeGrid, setShakeSizeGrid] = useState(false);

  // Product Reviews states and hooks
  const { reviews, total: reviewsCount, isLoading: reviewsLoading } = useProductReviews(product?.id || "");
  const { data: identity } = useCurrentIdentity();
  const { data: profile } = useUserProfile();
  const { isAuthenticated } = useAuth();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Advanced Interactive Features states
  const [selectedCurrency, setSelectedCurrency] = useState<"EUR" | "USD" | "SGD">("EUR");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [colorImages, setColorImages] = useState<string[]>([]);
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (product) {
      const initialColor = product.variants?.[0]?.color || product.color || "";
      setSelectedColor(initialColor);
      setColorImages(product.images);
    }
  }, [product]);

  // Dynamically query color-specific variant media
  useEffect(() => {
    if (!product || !selectedColor) return;
    
    const productId = product.id;
    const fallbackImages = product.images;
    let active = true;
    
    async function fetchColorMedia() {
      setIsFetchingMedia(true);
      try {
        const res = await api.GET<{
          color: string;
          variants: {
            variantId: string;
            sku: string;
            size: string | null;
            mediaAssets: {
              assetId: string;
              storageKey: string;
              mimeType: string;
              altText: string | null;
            }[];
          }[];
        }>(`/api/v1/products/${productId}/variants/media/color/${encodeURIComponent(selectedColor)}`);
        
        if (!active) return;
        
        if (res.data && res.data.variants && res.data.variants.length > 0) {
          const assets = res.data.variants.flatMap(v => v.mediaAssets);
          const uniqueKeys = Array.from(new Set(assets.map(a => a.storageKey)));
          const urls = uniqueKeys.map(key => key.startsWith("http") ? key : imageKitUrl(key));
          
          if (urls.length > 0) {
            setColorImages(urls);
          } else {
            setColorImages(fallbackImages);
          }
        } else {
          setColorImages(fallbackImages);
        }
      } catch (err) {
        console.warn("Failed to fetch variant color media, using fallback.", err);
        if (active) {
          setColorImages(fallbackImages);
        }
      } finally {
        if (active) {
          setIsFetchingMedia(false);
        }
      }
    }
    
    fetchColorMedia();
    
    return () => {
      active = false;
    };
  }, [selectedColor, product]);

  // Dynamically compute sizing availability specifically for the selected finish
  const isSizeAvailable = useCallback((sizeValue: string) => {
    if (!product) return false;
    if (!product.variants || product.variants.length === 0) {
      const staticSizeObj = product.sizes.find(s => s.value === sizeValue);
      return staticSizeObj ? staticSizeObj.isAvailable : false;
    }
    
    return product.variants.some(
      v =>
        v.color?.toLowerCase() === selectedColor.toLowerCase() &&
        v.size === sizeValue &&
        ((v.inventory ?? 0) > 0 || v.allowPreorder || v.allowBackorder)
    );
  }, [product, selectedColor]);

  // Check if variant combination exists at all in the catalog
  const hasVariant = useCallback((sizeValue: string) => {
    if (!product) return false;
    if (!product.variants || product.variants.length === 0) return true;
    return product.variants.some(
      v => v.color?.toLowerCase() === selectedColor.toLowerCase() && v.size === sizeValue
    );
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedSize) return null;
    return product.variants?.find(
      v => v.color?.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
    ) || null;
  }, [product, selectedColor, selectedSize]);

  // Compute if the currently selected size/finish is out of stock (and doesn't allow preorder/backorder)
  const isSelectedOutOfStock = useMemo(() => {
    if (!selectedSize) return false;
    if (!selectedVariant) return true;
    const inventory = selectedVariant.inventory ?? 0;
    const isPreorderOrBackorder = selectedVariant.allowPreorder || selectedVariant.allowBackorder;
    return inventory <= 0 && !isPreorderOrBackorder;
  }, [selectedSize, selectedVariant]);

  const getButtonText = () => {
    if (isAdding) return "Adding to Bag...";
    if (!selectedSize) return "Select Size";
    
    if (isSelectedOutOfStock) {
      return "Notify Me When Available";
    }
    
    if (selectedVariant) {
      const inventory = selectedVariant.inventory ?? 0;
      if (inventory <= 0) {
        if (selectedVariant.allowPreorder) return "Pre-order";
        if (selectedVariant.allowBackorder) return "Back-order";
      }
    }
    return "Add to Cart";
  };

  // Safe size reset if change of finish results in selected size variant not existing
  useEffect(() => {
    if (selectedSize && !hasVariant(selectedSize)) {
      setSelectedSize(null);
    }
  }, [selectedColor, selectedSize, hasVariant]);

  // Determine if footwear or leather goods for size guide matrix conversions
  const isFootwear = product 
    ? !["bag", "wallet", "sleeve", "strap", "belt"].some(keyword => 
        product.name.toLowerCase().includes(keyword) ||
        slug.toLowerCase().includes(keyword)
      )
    : true;

  const getLocalizedPrice = () => {
    if (!product) return { symbol: "€", value: 0 };
    if (selectedCurrency === "USD" && product.priceUsd) {
      return { symbol: "$", value: product.priceUsd };
    }
    if (selectedCurrency === "SGD" && product.priceSgd) {
      return { symbol: "S$", value: product.priceSgd };
    }
    return { symbol: "€", value: product.price };
  };

  const localizedPrice = getLocalizedPrice();

  const averageRating = reviews.length > 0 
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  const distribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const handleWishlistClick = async () => {
    if (!product) return;
    if (!selectedSize) {
      toast.info("Please select a size first to add to your wishlist.");
      setShakeSizeGrid(true);
      setTimeout(() => setShakeSizeGrid(false), 500);
      return;
    }
    await addToWishlist(product.id, product.name, selectedSize, selectedColor);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      toast.info("Please select a size first to add to your shopping bag.");
      setShakeSizeGrid(true);
      setTimeout(() => setShakeSizeGrid(false), 500);
      return;
    }

    if (isSelectedOutOfStock) {
      setIsRestockModalOpen(true);
      return;
    }

    const activeVariant = product.variants?.find(
      v => v.color?.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
    );

    if (!activeVariant) {
      setIsRestockModalOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      const success = await addToCart(activeVariant.id, 1);
      if (success) {
        toast.success(`${product.name} (Size ${selectedSize}) has been added to your shopping bag!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item to your shopping bag.");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream space-y-6">
        <p className="font-serif text-xl text-charcoal/60 uppercase tracking-widest">Product not found in our archives.</p>
        <Link href="/catalog/women/heeled-sandals" className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-gold transition-colors">
          Return to Collection
        </Link>
      </div>
    );
  }

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const accordionData = [
    { id: "description", label: "Description", content: "Artisanal heeled sandals handcrafted in Italy. Featuring delicate mocha dots on premium leather, a comfortable 75mm heel, and a secure ankle strap." },
    { id: "traceability", label: "Traceability & Recyclability", content: "Designed in Paris, handcrafted in our family-owned workshop in Tuscany, Italy. Leather sourced from certified European tanneries." },
    { id: "shipping", label: "Shipping & Returns", content: "Free shipping on orders over $300. Easy returns within 30 days. Taxes and duties included." }
  ];

  return (
    <div className="bg-cream w-full min-h-screen">
      <div className="flex flex-col lg:flex-row bg-cream max-w-[1440px] mx-auto">
        {/* Left Column: Editorial Image Grid (2-3 Layout) */}
        <div className="w-full lg:w-[65%] p-4 lg:p-6 space-y-2 lg:space-y-3">
          {isFetchingMedia ? (
            <div className="min-h-[50vh] flex items-center justify-center bg-cream/50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Row 1: 2 Images */}
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                {colorImages.slice(0, 2).map((image, index) => (
                  <div key={`row1-${index}`} className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm group">
                    <img
                      src={image || "/images/placeholder.png"}
                      alt={`${product.name} lifestyle ${index + 1}`}
                      className="object-cover w-full h-full transition-transform duration-[2000ms] ease-editorial group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
              
              {/* Row 2: 3 Images */}
              {colorImages.length > 2 && (
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  {colorImages.slice(2, 5).map((image, index) => (
                    <div key={`row2-${index}`} className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm group">
                      <img
                        src={image || "/images/placeholder.png"}
                        alt={`${product.name} detail ${index + 1}`}
                        className="object-cover w-full h-full transition-transform duration-[2000ms] ease-editorial group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Sticky Product Registry (Unified Scroll) */}
        <div className="w-full lg:w-[35%] lg:sticky lg:top-0 self-start p-4 lg:p-6 xl:p-8 space-y-5">
          {/* Header & Breadcrumbs */}
          <div className="space-y-3">
            <nav className="text-[9px] uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
              <Link href="/" className="hover:text-gold transition-colors">Collection</Link>
              <span>/</span>
              <Link href="/catalog/women/heeled-sandals" className="hover:text-gold transition-colors">Heeled Sandals</Link>
            </nav>

            <div className="space-y-1">
              <div className="flex justify-between items-start border-b border-sand/10 pb-4">
                <div className="space-y-0.5">
                  <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-widest leading-none uppercase font-bold animate-fade-in">
                    {product.name}
                  </h1>
                  <p className="text-[11px] text-stone-400 font-medium tracking-wide italic">
                    {selectedColor}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <p className="text-base font-bold text-charcoal tracking-tight">
                      {localizedPrice.symbol} {localizedPrice.value}
                    </p>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value as "EUR" | "USD" | "SGD")}
                      className="text-[9px] font-bold tracking-widest uppercase border border-sand/20 rounded-none bg-cream text-charcoal py-0.5 px-1.5 focus:ring-0 focus:border-charcoal cursor-pointer transition-colors"
                    >
                      <option value="EUR">EUR</option>
                      {product.priceUsd && <option value="USD">USD</option>}
                      {product.priceSgd && <option value="SGD">SGD</option>}
                    </select>
                  </div>
                  <button 
                    onClick={handleWishlistClick}
                    disabled={isLoadingWishlist}
                    className="text-stone-400 hover:text-burgundy transition-colors disabled:opacity-50"
                    aria-label="Add to wishlist"
                  >
                    <Heart 
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isLoadingWishlist && "scale-90 opacity-50",
                        selectedSize && "hover:scale-110"
                      )} 
                      strokeWidth={1} 
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Variant Swatches */}
          <div className="space-y-3 pb-4 border-b border-sand/10">
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-charcoal">Available Finishes</label>
            <div className="flex flex-wrap gap-3">
              {(() => {
                const uniqueColors = product.variants 
                  ? Array.from(new Set(product.variants.map(v => v.color).filter((c): c is string => !!c)))
                  : [];
                const colorsToRender = uniqueColors.length > 0 ? uniqueColors : [product.color || "Mocha Dots"];
                return colorsToRender.map((colorName) => {
                  const isSelected = selectedColor.toLowerCase() === colorName.toLowerCase();
                  return (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(colorName)}
                      className="group flex flex-col items-center gap-1 focus:outline-none"
                      aria-label={`Select finish ${colorName}`}
                    >
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full border p-0.5 transition-all duration-300",
                          isSelected ? "border-charcoal scale-110" : "border-sand/20 hover:border-charcoal"
                        )}
                      >
                        <div 
                          className="w-full h-full rounded-full shadow-inner transition-transform duration-300 group-hover:scale-95"
                          style={{ backgroundColor: getColorHex(colorName) }}
                        />
                      </div>
                      <span className={cn(
                        "text-[8px] tracking-wider uppercase font-medium transition-colors duration-300",
                        isSelected ? "text-charcoal font-bold" : "text-stone-400 group-hover:text-charcoal"
                      )}>
                        {colorName.split(" ")[0]}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

        {/* Size Selection Registry */}
        <div className="space-y-3">
          {shakeSizeGrid && (
            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                20%, 40%, 60%, 80% { transform: translateX(4px); }
              }
              .animate-shake {
                animation: shake 0.5s ease-in-out;
              }
            `}</style>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-charcoal">Size</label>
              <select className="text-[9px] font-bold uppercase border-none bg-transparent focus:ring-0 p-0 cursor-pointer">
                <option>EU</option>
              </select>
            </div>
          </div>

          <div className={cn("grid grid-cols-4 gap-1.5 transition-transform duration-300", shakeSizeGrid && "animate-shake")}>
            {product.sizes.map((size) => {
              const available = isSizeAvailable(size.value);
              const exists = hasVariant(size.value);
              return (
                <button
                  key={size.value}
                  disabled={!exists}
                  onClick={() => setSelectedSize(size.value)}
                  className={cn(
                    "h-11 border text-[11px] font-bold transition-all duration-300 relative",
                    !exists
                      ? "opacity-20 cursor-not-allowed border-stone-200 text-stone-300"
                      : !available
                        ? selectedSize === size.value
                          ? "bg-stone-100 text-charcoal border-charcoal overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[linear-gradient(to_top_right,transparent_49%,#e5e5e5_50%,transparent_51%)] cursor-pointer"
                          : "bg-stone-50 text-stone-400 border-stone-100 hover:border-charcoal overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[linear-gradient(to_top_right,transparent_49%,#e5e5e5_50%,transparent_51%)] cursor-pointer"
                        : selectedSize === size.value
                          ? "bg-charcoal text-cream border-charcoal"
                          : "bg-white text-charcoal border-sand/30 hover:border-charcoal"
                  )}
                >
                  {size.value}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-[9px] text-stone-400 flex items-center gap-2 uppercase tracking-widest font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-300" /> Notify me when back in stock
            </p>
          </div>

          {selectedVariant && (selectedVariant.inventory ?? 0) <= 0 && selectedVariant.restockEta && (
            <div className="mt-3 p-3 bg-ivory/30 border border-sand/10 text-[10px] text-stone-500 uppercase tracking-widest leading-relaxed">
              <span className="font-bold text-charcoal">
                {selectedVariant.allowPreorder ? "Pre-order expected release: " : "Back-order expected arrival: "}
              </span>
              <span>
                {new Date(selectedVariant.restockEta).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Sizing Advice */}
        <div className="bg-ivory/50 p-4 rounded-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Sizing Advice</span>
            <button 
              onClick={() => setIsSizeGuideOpen(true)}
              className="text-[9px] font-bold uppercase flex items-center gap-2 text-charcoal bg-white px-3 py-1 rounded-full border border-sand/20 hover:bg-stone-50 transition-colors"
            >
              <Ruler className="h-3 w-3" /> Find your size
            </button>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
            This model is <strong>true to size</strong>. We recommend you choose your usual size.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          <Button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full h-14 bg-charcoal hover:bg-stone-700 text-cream hover:text-white uppercase tracking-[0.3em] hover:tracking-[0.4em] text-[11px] font-bold rounded-none shadow-lg transition-all duration-500 active:scale-[0.98]"
          >
            {getButtonText()}
          </Button>

          {/* Trust Markers */}
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal leading-none">Enjoy Free Returns</p>
            <p className="text-[9px] text-stone-400 uppercase tracking-widest leading-none">Taxes and Duties included</p>
          </div>
        </div>

        {/* Product Details Accordion */}
        <div className="border-t border-sand/20 pt-2 space-y-0">
          {[
            { id: "description", label: "Description", content: "Artisanal heeled sandals handcrafted in Italy. Featuring delicate mocha dots on premium leather, a comfortable 75mm heel, and a secure ankle strap." },
            { id: "traceability", label: "Traceability & Recyclability", content: "Designed in Paris, handcrafted in our family-owned workshop in Tuscany, Italy. Leather sourced from certified European tanneries." },
            { id: "shipping", label: "Shipping & Returns", content: "Free shipping on orders over $300. Easy returns within 30 days. Taxes and duties included." }
          ].map((item) => (
            <div key={item.id} className="border-b border-sand/10">
              <button 
                onClick={() => toggleAccordion(item.id)}
                className="w-full py-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-charcoal group"
              >
                <span>{item.label}</span>
                <span className="text-stone-300 group-hover:text-charcoal transition-colors text-lg font-light leading-none">
                  {activeAccordion === item.id ? "−" : "+"}
                </span>
              </button>
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                activeAccordion === item.id ? "max-h-40 pb-6" : "max-h-0"
              )}>
                <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* Product Reviews & Ratings (Social Proof) Section */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 xl:px-12 py-16 border-t border-sand/20 bg-cream/40">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand/20 pb-6">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl lg:text-3xl text-charcoal uppercase tracking-widest font-bold">
                Guest Reviews
              </h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
                Real feedback from our verified collectors
              </p>
            </div>
            
            {/* CTA to write a review */}
            <div>
              {!isMounted ? (
                <div className="w-36 h-10 bg-stone-100 rounded-full animate-pulse" />
              ) : isAuthenticated && identity ? (
                reviews.some((r) => r.userId === identity.userId) ? (
                  <button
                    disabled
                    className="px-8 py-3 rounded-full bg-stone-100 text-stone-400 text-[9px] font-bold uppercase tracking-widest cursor-not-allowed shadow-none border border-sand/10"
                    title="You have already reviewed this product."
                  >
                    Already Reviewed
                  </button>
                ) : (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="px-8 py-3 rounded-full bg-charcoal hover:bg-burgundy text-white text-[9px] font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
                  >
                    Write a Review
                  </button>
                )
              ) : (
                <div className="text-right">
                  <Link
                    href="/sign-in"
                    className="inline-block px-8 py-3 rounded-full border border-charcoal/30 hover:border-charcoal text-[9px] font-bold uppercase tracking-widest text-charcoal transition-all hover:bg-charcoal hover:text-white"
                  >
                    Sign In to Leave a Review
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Grid */}
          {reviews.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 bg-white/40 border border-sand/15 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-1 text-stone-300">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-6 w-6 stroke-[1.25]" />
                ))}
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-base text-charcoal uppercase tracking-widest font-bold">
                  No Reviews Yet
                </h3>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium max-w-sm">
                  Be the first to share your thoughts on this exceptional, artisanal piece.
                </p>
              </div>
            </div>
          ) : (
            /* Live Ratings & Distribution Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              
              {/* Ratings Summary Card */}
              <div className="space-y-6 bg-white/40 border border-sand/15 rounded-xl p-6 lg:p-8 shadow-sm h-fit">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="font-serif text-5xl font-bold text-charcoal tracking-tight">
                      {averageRating}
                    </span>
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
                      / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const isFull = starIndex <= Math.floor(averageRating);
                      const isHalf = !isFull && starIndex - 0.5 <= averageRating;
                      return (
                        <Star
                          key={starIndex}
                          className={cn(
                            "h-4 w-4 stroke-[1.5]",
                            isFull ? "fill-gold stroke-gold" : isHalf ? "fill-gold/50 stroke-gold" : "fill-transparent stroke-stone-300"
                          )}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                    Based on {reviewsCount} customer {reviewsCount === 1 ? "review" : "reviews"}
                  </p>
                </div>

                {/* Distribution bars */}
                <div className="space-y-3 pt-4 border-t border-sand/15">
                  {([5, 4, 3, 2, 1] as const).map((ratingVal) => {
                    const count = distribution[ratingVal];
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={ratingVal} className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-charcoal">
                        <span className="w-12 text-stone-500">{ratingVal} Star</span>
                        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden border border-sand/10">
                          <div
                            className="bg-gold h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-stone-400">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews Feed list */}
              <div className="md:col-span-2 space-y-6">
                {reviews.map((review) => {
                  // Generate reliable derived collector names from user UUIDs
                  const pseudonyms = [
                    "Elena M.", "Marcus V.", "Sophia L.", "Julian P.", "Charlotte B.",
                    "Adrian K.", "Clara G.", "Raphael S.", "Victoria D.", "Christian T."
                  ];
                  // Map UUID to index
                  const nameIndex = review.userId.split("-").reduce((acc, part) => acc + parseInt(part, 16) || 0, 0) % pseudonyms.length;
                  
                  const isCurrentUser = identity && review.userId === identity.userId;
                  const collectorName = isMounted && isCurrentUser && profile
                    ? `${profile.firstName} ${profile.lastName ? profile.lastName[0] + "." : ""}`
                    : (review.reviewerName || pseudonyms[nameIndex] || "Verified Collector");
                  
                  const avatarInitials = collectorName.split(" ").map(n => n[0]).join("");
                  
                  const dateStamp = isMounted 
                    ? new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                      }).toUpperCase()
                    : "REVIEW COLLECTED";

                  return (
                    <div
                      key={review.id}
                      className="bg-white/70 border border-sand/15 rounded-xl p-6 shadow-sm space-y-4 hover:border-sand/45 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      {/* Review Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-charcoal/5 border border-sand/30 flex items-center justify-center text-charcoal font-serif font-bold text-[10px] tracking-wider">
                            {avatarInitials}
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-charcoal leading-none">
                              {collectorName}
                            </h4>
                            <span className="text-[8px] font-semibold text-stone-400 uppercase tracking-widest">
                              Verified Purchase
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                            {dateStamp}
                          </span>
                        </div>
                      </div>

                      {/* Stars & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "h-3.5 w-3.5 stroke-[1.5]",
                                s <= review.rating ? "fill-gold stroke-gold" : "fill-transparent stroke-stone-300"
                              )}
                            />
                          ))}
                        </div>
                        {review.title && (
                          <h5 className="font-serif text-sm font-bold text-charcoal uppercase tracking-wider">
                            {review.title}
                          </h5>
                        )}
                      </div>

                      {/* Review Body */}
                      {review.body && (
                        <p className="text-[11px] text-stone-600 leading-relaxed tracking-wide font-sans">
                          {review.body}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Dynamic Sizing Companion Drawer Overlay */}
      {isMounted && (
        <SizeGuideDrawer 
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          isFootwear={isFootwear}
          onSelectSize={(size) => {
            setSelectedSize(size);
            toast.success(`Size ${size} auto-filled successfully.`);
          }}
          availableSizes={product.sizes.map(s => ({
            value: s.value,
            isAvailable: isSizeAvailable(s.value)
          }))}
        />
      )}

      {/* Portal components */}
      {isMounted && isAuthenticated && identity && (
        <WriteReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          productId={product.id}
          userId={identity.userId}
        />
      )}
      {isMounted && selectedVariant && (
        <RestockAlertModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          variantId={selectedVariant.id}
          sizeName={selectedSize || ""}
          colorName={selectedColor}
          productName={product.name}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sizing Companion Drawer Subcomponent
// ─────────────────────────────────────────────────────────────────────────────

interface SizeGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isFootwear: boolean;
  onSelectSize: (size: string) => void;
  availableSizes: { value: string; isAvailable: boolean }[];
}

function SizeGuideDrawer({ isOpen, onClose, isFootwear, onSelectSize, availableSizes }: SizeGuideDrawerProps) {
  const [activeUnit, setActiveUnit] = useState<"metric" | "imperial">("metric");
  
  if (!isOpen) return null;

  // Premium footwear measurement conversions
  const shoeConversions = [
    { eu: "35", us: "5", uk: "2.5", cm: "22.4", in: "8.8" },
    { eu: "36", us: "6", uk: "3.5", cm: "23.0", in: "9.0" },
    { eu: "37", us: "6.5", uk: "4.0", cm: "23.7", in: "9.3" },
    { eu: "38", us: "7.5", uk: "5.0", cm: "24.4", in: "9.6" },
    { eu: "39", us: "8.5", uk: "6.0", cm: "25.0", in: "9.8" },
    { eu: "40", us: "9.0", uk: "6.5", cm: "25.7", in: "10.1" },
    { eu: "41", us: "10.0", uk: "7.5", cm: "26.4", in: "10.4" },
    { eu: "42", us: "11.0", uk: "8.5", cm: "27.0", in: "10.6" },
  ];

  // Premium accessories dimensions conversions
  const bagSizes = [
    { size: "One Size", wCm: "22", hCm: "15", dCm: "6", wIn: "8.6", hIn: "5.9", dIn: "2.4" },
    { size: "Mini", wCm: "18", hCm: "12", dCm: "5", wIn: "7.0", hIn: "4.7", dIn: "2.0" },
    { size: "Small", wCm: "20", hCm: "14", dCm: "5.5", wIn: "7.8", hIn: "5.5", dIn: "2.1" },
    { size: "Medium", wCm: "25", hCm: "18", dCm: "8", wIn: "9.8", hIn: "7.0", dIn: "3.1" },
    { size: "Large", wCm: "32", hCm: "24", dCm: "12", wIn: "12.6", hIn: "9.4", dIn: "4.7" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
      />
      
      {/* Smooth sliding drawer */}
      <div className="relative w-full max-w-md h-full bg-cream border-l border-sand/25 shadow-2xl p-6 lg:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-sand/20 pb-4">
            <div className="space-y-1">
              <h2 className="font-serif text-lg lg:text-xl text-charcoal uppercase tracking-widest font-bold">Size Companion</h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Find your luxury fit</p>
            </div>
            <button 
              onClick={onClose}
              className="text-stone-400 hover:text-charcoal transition-colors p-2 text-lg font-light"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-none border border-sand/30 p-0.5 bg-white">
              <button
                onClick={() => setActiveUnit("metric")}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                  activeUnit === "metric" ? "bg-charcoal text-cream" : "text-stone-400 hover:text-charcoal"
                )}
              >
                Metric (cm)
              </button>
              <button
                onClick={() => setActiveUnit("imperial")}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                  activeUnit === "imperial" ? "bg-charcoal text-cream" : "text-stone-400 hover:text-charcoal"
                )}
              >
                Imperial (in)
              </button>
            </div>
          </div>

          {/* Dynamic Table Rendering */}
          {isFootwear ? (
            <div className="border border-sand/15 overflow-hidden bg-white rounded-sm shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-sand/15 text-[8px] font-bold uppercase tracking-widest text-stone-800">
                    <th className="p-3">EU</th>
                    <th className="p-3">US</th>
                    <th className="p-3">UK</th>
                    <th className="p-3">{activeUnit === "metric" ? "Foot (CM)" : "Foot (IN)"}</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/10 text-[10px] text-charcoal">
                  {shoeConversions.map((row) => {
                    const isAvailable = availableSizes.some(
                      s => s.value === row.eu && s.isAvailable
                    );
                    
                    return (
                      <tr 
                        key={row.eu} 
                        className={cn(
                          "transition-colors", 
                          isAvailable ? "hover:bg-cream/40" : "bg-stone-50/30 opacity-60"
                        )}
                      >
                        <td className="p-3 font-bold">{row.eu}</td>
                        <td className="p-3 text-stone-700 font-medium">{row.us}</td>
                        <td className="p-3 text-stone-700 font-medium">{row.uk}</td>
                        <td className="p-3 text-stone-700 font-semibold">
                          {activeUnit === "metric" ? `${row.cm} cm` : `${row.in} in`}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              onSelectSize(row.eu);
                              onClose();
                            }}
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest transition-colors border-b",
                              isAvailable
                                ? "text-gold hover:text-charcoal border-gold hover:border-charcoal"
                                : "text-stone-400 hover:text-charcoal border-stone-300 hover:border-charcoal"
                            )}
                          >
                            {isAvailable ? "Select" : "Notify Me"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-sand/15 overflow-hidden bg-white rounded-sm shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-sand/15 text-[8px] font-bold uppercase tracking-widest text-stone-800">
                    <th className="p-3">Size</th>
                    <th className="p-3">Width</th>
                    <th className="p-3">Height</th>
                    <th className="p-3">Depth</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/10 text-[10px] text-charcoal">
                  {bagSizes.map((row) => {
                    const isAvailable = availableSizes.some(
                      s => s.value.toLowerCase() === row.size.toLowerCase() && s.isAvailable
                    );
                    
                    return (
                      <tr 
                        key={row.size} 
                        className={cn(
                          "transition-colors", 
                          isAvailable ? "hover:bg-cream/40" : "bg-stone-50/30 opacity-60"
                        )}
                      >
                        <td className="p-3 font-bold">{row.size}</td>
                        <td className="p-3 text-stone-700 font-medium">
                          {activeUnit === "metric" ? `${row.wCm} cm` : `${row.wIn} in`}
                        </td>
                        <td className="p-3 text-stone-700 font-medium">
                          {activeUnit === "metric" ? `${row.hCm} cm` : `${row.hIn} in`}
                        </td>
                        <td className="p-3 text-stone-700 font-medium">
                          {activeUnit === "metric" ? `${row.dCm} cm` : `${row.dIn} in`}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              onSelectSize(row.size);
                              onClose();
                            }}
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest transition-colors border-b",
                              isAvailable
                                ? "text-gold hover:text-charcoal border-gold hover:border-charcoal"
                                : "text-stone-400 hover:text-charcoal border-stone-300 hover:border-charcoal"
                            )}
                          >
                            {isAvailable ? "Select" : "Notify Me"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sizing Advice block */}
          <div className="bg-ivory/50 p-4 border border-sand/15 space-y-2 rounded-sm">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-charcoal">Sizing Notes</h4>
            <p className="text-[10px] text-stone-500 leading-relaxed uppercase tracking-wider">
              {isFootwear 
                ? "This item runs true to size. If you are between sizes, we recommend selecting the larger size for optimal toe bed comfort."
                : "Dimensions may vary slightly by +/- 1cm due to the artisanal hand-stitching processes in our Florentine ateliers."}
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-sand/20 pt-4 flex flex-col items-center gap-2 bg-cream/40">
          <p className="text-[9px] text-stone-400 uppercase tracking-widest font-medium text-center">
            Need further guidance? Our concierge is here to assist.
          </p>
          <a 
            href="mailto:concierge@tasheen.com"
            className="text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal hover:text-gold transition-colors"
          >
            Contact Client Services
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
