"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, ApiCallError } from "@/lib/api-client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

// Re-use same guest token as wishlist for seamless unified session profiles
function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("ts_guest_token");
  if (!token) {
    token = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("ts_guest_token", token);
  }
  return token;
}

export interface CartProductImage {
  url: string;
  alt?: string;
}

export interface CartProduct {
  productId: string;
  title: string;
  slug: string;
  images?: CartProductImage[];
}

export interface CartVariant {
  size?: string;
  color?: string;
  sku: string;
  allowPreorder?: boolean;
  allowBackorder?: boolean;
  restockEta?: string | null;
  inventory?: number;
}

export interface AppliedPromo {
  id: string;
  code: string;
  type: string;
  value: number;
  description?: string;
  appliedAt: string;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  appliedPromos: AppliedPromo[];
  isGift: boolean;
  giftMessage?: string;
  hasPromosApplied: boolean;
  hasFreeShipping: boolean;
  product?: CartProduct;
  variant?: CartVariant;
}

export interface CartSummary {
  cartId: string;
  isUserCart: boolean;
  isGuestCart: boolean;
  currency: string;
  itemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  shippingAmount?: number;
  hasGiftItems: boolean;
  hasFreeShipping: boolean;
  isEmpty: boolean;
  isReservationExpired: boolean;
  reservationExpiresAt?: string;
  updatedAt: string;
}

export interface CartDto {
  cartId: string;
  userId?: string;
  guestToken?: string;
  currency: string;
  items: CartItem[];
  summary: CartSummary;
  reservationExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CartContextValue {
  cart: CartDto | null;
  isLoading: boolean;
  refetchCart: () => Promise<void>;
  addToCart: (variantId: string, quantity: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (variantId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to attach guest headers
  const getHeaders = useCallback(() => {
    const guestToken = getOrCreateGuestToken();
    return guestToken
      ? { headers: { "x-guest-token": guestToken, "guest-token": guestToken } }
      : {};
  }, []);

  const loadCart = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const guestToken = getOrCreateGuestToken();

      if (isAuthenticated) {
        // 1. Fetch current identity to retrieve userId
        const user = await api.get<any>("/auth/me");
        const userId = user?.userId;
        if (!userId) throw new Error("User identity not found.");

        // 2. Fetch or create authenticated cart
        try {
          const fetchedCart = await api.get<CartDto>(`/users/${userId}/cart`);
          setCart(fetchedCart);
        } catch (err: any) {
          if (err instanceof ApiCallError && err.statusCode === 404) {
            // Create user cart if missing
            const newCart = await api.post<CartDto>(`/users/${userId}/cart`, {
              currency: "USD",
            });
            setCart(newCart);
          } else {
            throw err;
          }
        }
      } else {
        // 3. Guest User - Fetch or create guest cart
        try {
          const fetchedCart = await api.get<CartDto>(
            `/guests/${guestToken}/cart`,
            getHeaders()
          );
          setCart(fetchedCart);
        } catch (err: any) {
          if (err instanceof ApiCallError && err.statusCode === 404) {
            // Create guest cart if missing
            const newCart = await api.post<CartDto>(
              `/guests/${guestToken}/cart`,
              { currency: "USD" },
              getHeaders()
            );
            setCart(newCart);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load shopping bag:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, getHeaders]);

  // Handle guest cart transfer seamlessly upon successful authentication
  useEffect(() => {
    const handleCartTransfer = async () => {
      if (authLoading || !isAuthenticated) return;
      const guestToken = getOrCreateGuestToken();
      if (!guestToken) return;

      try {
        // Check if there is an active guest cart to transfer
        let guestCart: CartDto | null = null;
        try {
          guestCart = await api.get<CartDto>(
            `/guests/${guestToken}/cart`,
            getHeaders()
          );
        } catch {
          // No guest cart found; nothing to transfer
        }

        if (guestCart && guestCart.items && guestCart.items.length > 0) {
          const user = await api.get<any>("/auth/me");
          const userId = user?.userId;
          if (userId) {
            // Call the transfer endpoint
            await api.post(`/guests/${guestToken}/cart/transfer`, {
              userId,
              mergeWithExisting: true,
            });
            toast.success("Merged your guest selections into your account bag!");
          }
        }
      } catch (err) {
        console.error("Failed to transfer guest cart:", err);
      } finally {
        // Force refresh cart states
        loadCart();
      }
    };

    handleCartTransfer();
  }, [isAuthenticated, authLoading]);

  // Refresh cart on mount or auth changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = async (variantId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await api.post<CartDto>(
        "/cart/items",
        {
          variantId,
          quantity,
        },
        getHeaders()
      );
      setCart(updatedCart);
      return true;
    } catch (err: any) {
      if (err instanceof ApiCallError && err.statusCode < 500) {
        console.warn("Could not add item to bag (client/business rule):", err.message);
      } else {
        console.error("Failed to add item to bag:", err);
      }
      let errorMsg = "Could not add item to bag.";
      if (
        (err instanceof ApiCallError && err.code === "INSUFFICIENT_INVENTORY") ||
        err.code === "INSUFFICIENT_INVENTORY" ||
        err.message?.toUpperCase().includes("INSUFFICIENT INVENTORY")
      ) {
        errorMsg = "We're sorry, but the requested quantity exceeds available stock.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (!cart) return false;
    setIsLoading(true);
    try {
      const updatedCart = await api.patch<CartDto>(
        `/carts/${cart.cartId}/items/${variantId}`,
        { quantity },
        getHeaders()
      );
      setCart(updatedCart);
      return true;
    } catch (err: any) {
      if (err instanceof ApiCallError && err.statusCode < 500) {
        console.warn("Could not update item quantity (client/business rule):", err.message);
      } else {
        console.error("Failed to update item quantity:", err);
      }
      let errorMsg = "Failed to update quantity.";
      if (
        (err instanceof ApiCallError && err.code === "INSUFFICIENT_INVENTORY") ||
        err.code === "INSUFFICIENT_INVENTORY" ||
        err.message?.toUpperCase().includes("INSUFFICIENT INVENTORY")
      ) {
        errorMsg = "We're sorry, but the requested quantity exceeds available stock.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (variantId: string) => {
    if (!cart) return false;
    setIsLoading(true);
    try {
      await api.delete(
        `/carts/${cart.cartId}/items/${variantId}`,
        getHeaders()
      );
      // Immediately filter item out of local state for instant responsive visual update
      setCart((prev) => {
        if (!prev) return null;
        const filteredItems = prev.items.filter((item) => item.variantId !== variantId);
        const subtotal = filteredItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
        const itemCount = filteredItems.reduce((acc, curr) => acc + curr.quantity, 0);
        return {
          ...prev,
          items: filteredItems,
          summary: {
            ...prev.summary,
            items: filteredItems,
            itemCount,
            subtotal,
            total: subtotal,
            isEmpty: filteredItems.length === 0,
          } as any,
        };
      });
      // Trigger full async reload
      loadCart();
      toast.success("Removed item from your shopping bag.");
      return true;
    } catch (err: any) {
      if (err instanceof ApiCallError && err.statusCode < 500) {
        console.warn("Could not remove item from bag (client/business rule):", err.message);
      } else {
        console.error("Failed to remove item from bag:", err);
      }
      toast.error(err.message || "Failed to remove item.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const guestToken = getOrCreateGuestToken();
      if (isAuthenticated) {
        const user = await api.get<any>("/auth/me");
        const userId = user?.userId;
        if (userId) {
          await api.delete(`/users/${userId}/cart`);
        }
      } else {
        await api.delete(`/guests/${guestToken}/cart`, getHeaders());
      }
      setCart(null);
      loadCart();
      return true;
    } catch (err: any) {
      if (err instanceof ApiCallError && err.statusCode < 500) {
        console.warn("Could not clear shopping bag (client/business rule):", err.message);
      } else {
        console.error("Failed to clear shopping bag:", err);
      }
      toast.error(err.message || "Failed to clear bag.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        refetchCart: loadCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
