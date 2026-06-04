"use client";

import { useEffect, useState, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Trash2, Loader2, ArrowRight, Share2, Edit, Plus, Globe, Lock } from "lucide-react";
import { useWishlist, type WishlistProduct } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { useWishlists } from "../hooks/useWishlists";
import { CreateWishlistModal } from "./CreateWishlistModal";
import type { Wishlist } from "../types";

export function WishlistList() {
  const { isAuthenticated } = useAuth();
  const { wishlistItems: items, isLoading: isItemsLoading, removeFromWishlist, refetchWishlist } = useWishlist();
  const { wishlists, isLoading: isListsLoading, deleteWishlist: deleteListMutation } = useWishlists();
  const { addToCart } = useCart();
  const router = useRouter();

  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Wishlist | null>(null);

  const activeId = typeof window !== "undefined" ? localStorage.getItem("ts_wishlist_id") : null;
  const currentList = wishlists.find((w) => w.id === activeId) || wishlists.find((w) => w.isDefault);

  useEffect(() => {
    // Sync active ID to default if none is set
    if (isAuthenticated && wishlists.length > 0 && !activeId) {
      const defaultList = wishlists.find((w) => w.isDefault);
      if (defaultList) {
        localStorage.setItem("ts_wishlist_id", defaultList.id);
        refetchWishlist();
      }
    }
  }, [isAuthenticated, wishlists, activeId, refetchWishlist]);

  const handleSwitchList = async (id: string) => {
    localStorage.setItem("ts_wishlist_id", id);
    await refetchWishlist();
    toast.info(`Switched collection`);
  };

  const handleRemove = async (variantId: string) => {
    setRemovingId(variantId);
    try {
      await removeFromWishlist(variantId);
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

  const handleDeleteActiveList = async () => {
    if (!currentList || currentList.isDefault) return;
    
    toast.warning(`Are you sure you want to delete "${currentList.name}"?`, {
      description: "This action will permanently purge this curation collection and all items within it.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteListMutation.mutateAsync(currentList.id);
            toast.success("Collection deleted successfully");
            
            // Reset active list to default
            const defaultList = wishlists.find((w) => w.isDefault);
            if (defaultList) {
              localStorage.setItem("ts_wishlist_id", defaultList.id);
            } else {
              localStorage.removeItem("ts_wishlist_id");
            }
            await refetchWishlist();
          } catch (err: any) {
            toast.error(err.message || "Failed to delete collection");
          }
        }
      },
      duration: 6000,
    });
  };

  const [isCopied, setIsCopied] = useState(false);
  const handleShare = () => {
    if (!currentList) return;
    const url = `${window.location.origin}/wishlist/share/${currentList.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLoading = isItemsLoading || (isAuthenticated && isListsLoading);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin stroke-[1.5]" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 mt-4 font-bold">
          Retrieving your archives...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-700">
      {/* Title block */}
      <div className="space-y-4 border-b border-sand/10 pb-6">
        <nav className="text-[9px] uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2 mb-2">
          <Link href="/" className="hover:text-gold transition-colors">Boutique</Link>
          <span>/</span>
          <span className="text-stone-500">Wishlist</span>
        </nav>
        
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-wide italic">
              {currentList ? currentList.name : "My Wishlist"}
            </h1>
            {currentList?.description && (
              <p className="text-xs text-stone-500 max-w-xl italic">
                {currentList.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {currentList && (
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-stone-400 font-bold bg-white/60 border border-sand/20 px-3 py-1.5 rounded-full shadow-sm">
                {currentList.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 text-gold" />
                    <span>Public Shareable</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-stone-400" />
                    <span>Private Curation</span>
                  </>
                )}
              </div>
            )}
            <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-bold">
              {items.length} {items.length === 1 ? "Item" : "Items"} Curated
            </p>
          </div>
        </div>

        {/* Collections Curation bar */}
        {isAuthenticated && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-sand/5">
            <div className="flex flex-wrap items-center gap-2">
              {wishlists.map((list) => {
                const isActive = list.id === currentList?.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => handleSwitchList(list.id)}
                    className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all duration-300 rounded-sm cursor-pointer ${
                      isActive
                        ? "bg-charcoal text-cream border-charcoal shadow-sm"
                        : "bg-white/40 border-sand/30 hover:border-sand/60 text-stone-600"
                    }`}
                  >
                    {list.name}
                  </button>
                );
              })}
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-gold border border-dashed border-gold/40 hover:border-gold transition-all duration-300 flex items-center gap-1 rounded-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Collection
              </button>
            </div>

            {currentList && (
              <div className="flex items-center gap-2">
                {currentList.isPublic && (
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 border border-sand/30 hover:border-gold text-stone-600 hover:text-gold text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-1.5 bg-white/40 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {isCopied ? "Copied" : "Share Link"}
                  </button>
                )}
                
                {!currentList.isDefault && (
                  <>
                    <button
                      onClick={() => {
                        setEditTarget(currentList);
                        setIsEditOpen(true);
                      }}
                      className="px-4 py-2 border border-sand/30 hover:border-gold text-stone-600 hover:text-gold text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-1.5 bg-white/40 cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      onClick={handleDeleteActiveList}
                      className="px-4 py-2 border border-sand/30 hover:border-burgundy text-stone-600 hover:text-burgundy text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-1.5 bg-white/40 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
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

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-6 min-h-[400px] animate-in fade-in duration-700">
          <div className="p-4 bg-stone-50 rounded-full border border-sand/10">
            <Heart className="h-10 w-10 text-stone-300 stroke-[1.2]" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl italic text-charcoal tracking-wide">
              This Collection is Empty
            </h3>
            <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
              Save pieces you love to this collection to build your seasonal or custom curations.
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
      ) : (
        /* Grid List */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.wishlistItemId}
              className="group flex flex-col space-y-4 bg-white/40 p-4 border border-sand/10 hover:border-sand/30 hover:bg-white/80 transition-all duration-500 rounded-sm shadow-sm hover:shadow-md relative animate-in fade-in duration-500"
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
      )}

      {/* Create Modal */}
      <CreateWishlistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Edit Modal */}
      {editTarget && (
        <CreateWishlistModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditTarget(null);
          }}
          initialData={editTarget}
        />
      )}
    </div>
  );
}
