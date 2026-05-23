"use client";

import { useEffect, useState, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Trash2, Loader2, ArrowRight } from "lucide-react";
import { useWishlist, type WishlistProduct } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export function WishlistList() {
  const { isAuthenticated } = useAuth();
  const { getWishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const wishlistProducts = await getWishlistItems();
      setItems(wishlistProducts);
    } catch (e) {
      console.error("Failed to load wishlist items:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRemove = async (variantId: string) => {
    setRemovingId(variantId);
    try {
      const success = await removeFromWishlist(variantId);
      if (success) {
        setItems((prev) => prev.filter((item) => item.variantId !== variantId));
      }
    } catch (e) {
      console.error("Failed to remove wishlist item", e);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToBag = async (item: WishlistProduct) => {
    if (!isAuthenticated) {
      router.push(`/sign-in?next=/wishlist`);
      return;
    }

    setAddingToCartId(item.variantId);
    try {
      const success = await addToCart(item.variantId, 1);
      if (success) {
        toast.success(`Added ${item.name} (Size ${item.size}) to your shopping bag!`);
      }
    } catch (err: any) {
      console.error("Failed to add wishlist item to cart:", err);
    } finally {
      setAddingToCartId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin stroke-[1.5]" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 mt-4 font-bold">
          Retrieving your archive...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-6 min-h-[400px] animate-in fade-in duration-700">
        <div className="p-4 bg-stone-50 rounded-full border border-sand/10">
          <Heart className="h-10 w-10 text-stone-300 stroke-[1.2]" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl italic text-charcoal tracking-wide">
            Your Wishlist is Empty
          </h3>
          <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
            Save pieces you love here to curate your personal wardrobe archives. They will remain saved for your next visit.
          </p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal hover:bg-stone-800 text-cream text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          Explore the Boutique
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-700">
      {/* Title block */}
      <div className="space-y-2 border-b border-sand/10 pb-6">
        <nav className="text-[9px] uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2 mb-2">
          <Link href="/" className="hover:text-gold transition-colors">Boutique</Link>
          <span>/</span>
          <span className="text-stone-500">Wishlist</span>
        </nav>
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-wide italic">
            My Wishlist
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-bold">
            {items.length} {items.length === 1 ? "Item" : "Items"} Curated
          </p>
        </div>
      </div>

      {/* Guest Sign-In Preservation Banner */}
      {!isAuthenticated && (
        <div className="bg-stone-50 border border-sand/30 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 rounded-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="font-serif text-lg italic text-charcoal tracking-wide">
              Preserve Your Curations
            </h4>
            <p className="text-[11px] text-stone-500 uppercase tracking-wider leading-relaxed max-w-xl">
              You are viewing this archive as a guest. Create an account or sign in to save your selection permanently and access it from any device.
            </p>
          </div>
          <Link
            href={`/sign-in?next=/wishlist`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-charcoal hover:bg-stone-800 text-cream text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md cursor-pointer"
          >
            Sign In / Register
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {items.map((item) => (
          <div
            key={item.wishlistItemId}
            className="group flex flex-col space-y-4 bg-white/40 p-4 border border-sand/10 hover:border-sand/30 hover:bg-white/80 transition-all duration-500 rounded-sm shadow-sm hover:shadow-md relative"
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

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                disabled={addingToCartId !== null || removingId !== null}
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

              <button
                disabled={addingToCartId !== null || removingId !== null}
                onClick={() => handleRemove(item.variantId)}
                className="w-full py-2.5 border border-sand/30 hover:border-burgundy text-stone-400 hover:text-burgundy disabled:border-stone-100 disabled:text-stone-300 uppercase tracking-[0.25em] text-[9px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {removingId === item.variantId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
