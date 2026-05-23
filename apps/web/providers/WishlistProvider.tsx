"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api, ApiCallError } from "@/lib/api-client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { imageKitUrl } from "@/lib/imagekit";
import { buildProductHref } from "@/features/catalog/api";

// Re-use same guest token generator
function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("ts_guest_token");
  if (!token) {
    token = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("ts_guest_token", token);
  }
  return token;
}

export interface WishlistProduct {
  wishlistItemId: string;
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

const variantCache: Record<string, any> = {};
const productCache: Record<string, any> = {};

interface WishlistContextValue {
  wishlistItems: WishlistProduct[];
  isLoading: boolean;
  addToWishlist: (productId: string, productName: string, size: string, color?: string) => Promise<boolean>;
  removeFromWishlist: (variantId: string) => Promise<boolean>;
  getWishlistItems: () => Promise<WishlistProduct[]>;
  refetchWishlist: () => Promise<WishlistProduct[]>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track the previous auth state to detect transitions
  const prevAuthRef = useRef<boolean | undefined>(undefined);
  // Guard to prevent the initial-load effect from racing the transfer
  const transferInProgressRef = useRef(false);

  /**
   * Resolve the correct wishlist ID for the current session.
   * - Authenticated users: creates or returns the user's default wishlist (server-side de-dup by userId).
   * - Guest users: creates or returns a guest wishlist keyed by guest token.
   *
   * The result is cached in localStorage as `ts_wishlist_id` to avoid extra round-trips.
   */
  const getOrCreateWishlistId = useCallback(async (guestToken: string): Promise<string> => {
    const cachedId = localStorage.getItem("ts_wishlist_id");
    if (cachedId) return cachedId;

    const res = await api.post<any>("/engagement/wishlists", {
      isDefault: true,
      name: isAuthenticated ? "My Wishlist" : "Guest Wishlist",
      guestToken: isAuthenticated ? undefined : guestToken,
    });

    if (res && res.id) {
      localStorage.setItem("ts_wishlist_id", res.id);
      return res.id;
    }

    throw new Error("Could not initialize wishlist.");
  }, [isAuthenticated]);

  /**
   * Fetch and enrich all items from the active wishlist.
   */
  const getWishlistItems = useCallback(async (): Promise<WishlistProduct[]> => {
    setIsLoading(true);
    try {
      const guestToken = getOrCreateGuestToken();
      const wishlistId = await getOrCreateWishlistId(guestToken);

      const res = await api.get<any>(`/engagement/wishlists/${wishlistId}/items`);
      const items = res?.items || [];

      if (items.length === 0) {
        setWishlistItems([]);
        return [];
      }

      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          try {
            const variantId = item.variantId;
            let variant = variantCache[variantId];
            if (!variant) {
              variant = await api.get<any>(`/variants/${variantId}`);
              variantCache[variantId] = variant;
            }

            const productId = variant.productId;
            let product = productCache[productId];
            if (!product) {
              product = await api.get<any>(`/products/${productId}`);
              productCache[productId] = product;
            }

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
              wishlistItemId: item.id,
              variantId,
              productId,
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
            } as WishlistProduct;
          } catch (err) {
            console.error(`Failed to enrich wishlist item ${item.id}:`, err);
            return null;
          }
        })
      );

      const validItems = enrichedItems.filter((i): i is WishlistProduct => i !== null);
      setWishlistItems(validItems);
      return validItems;
    } catch (err: any) {
      console.error("Failed to load wishlist items:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getOrCreateWishlistId]);

  // ── Auth transition handling ──────────────────────────────────────────────
  // This single effect handles ALL auth transitions:
  //   1. Login  (false → true):  transfer guest wishlist, then load the user's wishlist
  //   2. Logout (true → false):  clear cached wishlist, reset items
  //   3. Initial / steady state: just load items normally
  useEffect(() => {
    if (authLoading) return;

    const previousAuth = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    // ── Logout transition ───────────────────────────────────────────────
    if (previousAuth === true && isAuthenticated === false) {
      localStorage.removeItem("ts_wishlist_id");
      setWishlistItems([]);
      // After logout, load guest wishlist (which will be empty / new)
      getWishlistItems();
      return;
    }

    // ── Login transition ────────────────────────────────────────────────
    // The user just authenticated. If a guest wishlist exists, transfer its
    // items to the user's account wishlist before loading.
    if (previousAuth === false && isAuthenticated === true) {
      const guestToken = localStorage.getItem("ts_guest_token");
      const guestWishlistId = localStorage.getItem("ts_wishlist_id");

      if (guestWishlistId && guestToken) {
        transferInProgressRef.current = true;

        (async () => {
          try {
            // 1. Check if the guest wishlist actually has items
            let guestItems: any[] = [];
            try {
              const res = await api.get<any>(`/engagement/wishlists/${guestWishlistId}/items`);
              guestItems = res?.items || [];
            } catch {
              // Guest wishlist doesn't exist or can't be read — skip transfer
            }

            // 2. Transfer & merge if there are items
            if (guestItems.length > 0) {
              try {
                await api.post("/engagement/wishlists/transfer", {
                  guestWishlistId,
                  guestToken,
                });
                toast.success("Merged your guest wishlist items into your account wishlist!");
              } catch (err) {
                console.error("Failed to transfer guest wishlist:", err);
              }
            }
          } finally {
            // 3. Always clear the stale guest wishlist ID so subsequent calls
            //    resolve the authenticated user's own default wishlist.
            localStorage.removeItem("ts_wishlist_id");
            transferInProgressRef.current = false;

            // 4. Reload with the user's real wishlist
            getWishlistItems();
          }
        })();
      } else {
        // No guest wishlist to transfer — just clear stale cache and load
        localStorage.removeItem("ts_wishlist_id");
        getWishlistItems();
      }
      return;
    }

    // ── Steady state (page load / refresh) ──────────────────────────────
    // `previousAuth` is `undefined` on first render. Just load whatever
    // wishlist is current (guest or authenticated).
    if (!transferInProgressRef.current) {
      getWishlistItems();
    }

    // Note: we intentionally exclude `getWishlistItems` from the dep array
    // to avoid re-triggering on every callback identity change. The effect
    // only needs to run on auth-state transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const addToWishlist = async (productId: string, productName: string, size: string, color?: string) => {
    setIsLoading(true);
    try {
      const guestToken = getOrCreateGuestToken();
      const variantsRes = await api.get<any>(`/products/${productId}/variants`);
      const variants = variantsRes?.items || [];
      
      const matchingVariant = variants.find((v: any) => {
        const sizeMatch = String(v.size) === String(size);
        const colorMatch = color ? v.color?.toLowerCase() === color.toLowerCase() : true;
        return sizeMatch && colorMatch;
      });

      if (!matchingVariant) {
        toast.error(`Size ${size} variant is currently unavailable.`);
        return false;
      }

      const wishlistId = await getOrCreateWishlistId(guestToken);

      await api.post(`/engagement/wishlists/${wishlistId}/items`, {
        variantId: matchingVariant.id,
        guestToken: isAuthenticated ? undefined : guestToken,
      });

      toast.success(`Added ${productName} (Size ${size}) to your wishlist!`);
      
      // Automatically refresh the wishlist items so all badges update reactively!
      getWishlistItems();
      return true;
    } catch (err: any) {
      if (err instanceof ApiCallError && err.code === "WISHLIST_ITEM_ALREADY_EXISTS") {
        toast.info(`${productName} (Size ${size}) is already in your wishlist.`);
        return true;
      }

      toast.error(err.message || "Failed to add item to wishlist.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (variantId: string) => {
    setIsLoading(true);
    try {
      const guestToken = getOrCreateGuestToken();
      const wishlistId = await getOrCreateWishlistId(guestToken);

      await api.delete(`/engagement/wishlists/${wishlistId}/items/${variantId}`);
      toast.success("Removed item from your wishlist.");
      
      // Optimistically update local state for absolute responsive feel!
      setWishlistItems((prev) => prev.filter((item) => item.variantId !== variantId));
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        getWishlistItems,
        refetchWishlist: getWishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
