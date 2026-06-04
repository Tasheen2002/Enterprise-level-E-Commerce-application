/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, ShoppingBag, Loader2, ArrowRight, Lock, Globe } from "lucide-react";
import { api } from "@/lib/api-client";
import { imageKitUrl } from "@/lib/imagekit";
import { buildProductHref } from "@/features/product-catalog/api";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

interface ShareItem {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  color: string;
  price: number;
  currency: string;
  images: string[];
  href: string;
  size: string;
}

interface ListDetails {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
}

export default function WishlistSharePage() {
  const { id } = useParams() as { id: string };
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [listDetails, setListDetails] = useState<ListDetails | null>(null);
  const [items, setItems] = useState<ShareItem[]>([]);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadSharedWishlist = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch wishlist details
        const listRes = await api.get<any>(`/engagement/wishlists/${id}`);
        if (!listRes || !listRes.isPublic) {
          setIsPrivate(true);
          setIsLoading(false);
          return;
        }

        setListDetails({
          id: listRes.id,
          name: listRes.name,
          description: listRes.description,
          isPublic: listRes.isPublic,
        });

        // 2. Fetch items
        const itemsRes = await api.get<any>(`/engagement/wishlists/${id}/items`);
        const rawItems = itemsRes?.items || [];

        if (rawItems.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        // 3. Enrich items
        const enriched = await Promise.all(
          rawItems.map(async (item: any) => {
            try {
              const variantId = item.variantId;
              const variant = await api.get<any>(`/variants/${variantId}`);
              const product = await api.get<any>(`/products/${variant.productId}`);

              let variantImages: string[] = [];
              try {
                const mediaRes = await api.get<any>(`/variants/${variantId}/media`);
                if (mediaRes && mediaRes.mediaAssets && mediaRes.mediaAssets.length > 0) {
                  variantImages = mediaRes.mediaAssets.map((asset: any) => asset.storageKey);
                }
              } catch (err) {
                console.warn(`Failed to fetch media for variant ${variantId}:`, err);
              }

              return {
                id: item.id,
                variantId,
                productId: variant.productId,
                name: product.title,
                color: variant.color || product.brand || "Mocha Dots",
                price: product.price,
                currency: product.currency === "EUR" ? "€" : "US$",
                images: variantImages.length > 0
                  ? variantImages.map((img: string) => img.startsWith("http") ? img : imageKitUrl(img))
                  : (product.images && product.images.length > 0
                    ? product.images.map((img: string) => img.startsWith("http") ? img : imageKitUrl(img))
                    : [imageKitUrl("profile.jpg")]),
                href: buildProductHref(product.slug, product.categoryIds),
                size: variant.size || "",
              } as ShareItem;
            } catch (err) {
              console.error("Failed to enrich shared item:", err);
              return null;
            }
          })
        );

        setItems(enriched.filter((i): i is ShareItem => i !== null));
      } catch (err) {
        console.error("Failed to load shared wishlist:", err);
        setIsPrivate(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedWishlist();
  }, [id]);

  const handleAddToBag = async (item: ShareItem) => {
    if (!isAuthenticated) {
      window.location.href = `/sign-in?next=/wishlist/share/${id}`;
      return;
    }

    setAddingToCartId(item.variantId);
    try {
      const success = await addToCart(item.variantId, 1);
      if (success) {
        toast.success(`Added ${item.name} (Size ${item.size}) to your shopping bag!`);
      }
    } catch (err: any) {
      console.error("Failed to add shared item to cart:", err);
    } finally {
      setAddingToCartId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <MarketingHeader variant="solid" />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            <Loader2 className="h-8 w-8 text-gold animate-spin stroke-[1.5]" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 mt-4 font-bold">
              Decrypting curation...
            </p>
          </div>
        ) : isPrivate ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-6 min-h-[400px] animate-in fade-in duration-700">
            <div className="p-4 bg-stone-50 rounded-full border border-sand/20">
              <Lock className="h-10 w-10 text-stone-400 stroke-[1.2]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl italic text-charcoal tracking-wide">
                Private Curation
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
                This custom collection is private or does not exist. The curator has restricted access to their collection archives.
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal hover:bg-stone-800 text-cream text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-md"
            >
              Explore the Boutique
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-700">
            {/* Title block */}
            <div className="space-y-4 border-b border-sand/10 pb-6">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-stone-400">
                <Globe className="h-3.5 w-3.5 text-gold" />
                <span>Shared Collection</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-wide italic">
                    {listDetails?.name}
                  </h1>
                  {listDetails?.description && (
                    <p className="text-xs text-stone-500 max-w-xl italic">
                      {listDetails.description}
                    </p>
                  )}
                </div>
                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-bold">
                  {items.length} {items.length === 1 ? "Item" : "Items"} Shared
                </p>
              </div>
            </div>

            {/* Grid List */}
            {items.length === 0 ? (
              <div className="text-center py-20 text-stone-400 uppercase tracking-widest text-xs">
                This shared collection is empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col space-y-4 bg-white/40 p-4 border border-sand/10 hover:border-sand/30 hover:bg-white/80 transition-all duration-500 rounded-sm shadow-sm relative"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-50 rounded-sm">
                      <Link href={item.href} className="block h-full w-full">
                        <Image
                          src={item.images[0] || "/images/placeholder.png"}
                          alt={item.name}
                          fill
                          className="object-cover transition-all duration-[2000ms] ease-editorial group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"
                        />
                      </Link>
                    </div>

                    {/* Product Meta */}
                    <div className="flex justify-between items-start pt-1">
                      <div className="space-y-1 max-w-[70%]">
                        <h3 className="font-serif text-[13px] tracking-[0.2em] text-charcoal uppercase font-bold truncate">
                          <Link href={item.href} className="hover:text-gold transition-colors">
                            {item.name}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400 tracking-wide truncate">
                            {item.color}
                          </span>
                          <span className="h-1 w-1 bg-stone-300 rounded-full" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-gold whitespace-nowrap">
                            Size {item.size}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-charcoal tracking-tighter whitespace-nowrap">
                        {item.currency} {item.price}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                      <button
                        disabled={addingToCartId !== null}
                        onClick={() => handleAddToBag(item)}
                        className="w-full py-3.5 bg-charcoal hover:bg-stone-800 disabled:bg-stone-300 text-cream uppercase tracking-[0.25em] text-[10px] font-bold rounded-none shadow-sm transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {addingToCartId === item.variantId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5" />
                        )}
                        {addingToCartId === item.variantId ? "Adding..." : "Add to Bag"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
