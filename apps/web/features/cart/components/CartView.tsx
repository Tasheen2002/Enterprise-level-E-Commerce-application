"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/hooks/useCart";
import { imageKitUrl } from "@/lib/imagekit";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@tasheen/ui";

export function CartView() {
  const { cart, isLoading, updateQuantity, removeFromCart } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) {
      handleRemove(item.variantId);
      return;
    }
    setUpdatingItemId(item.variantId);
    try {
      const success = await updateQuantity(item.variantId, newQty);
      if (success) {
        toast.success(`Updated ${item.product?.title} quantity to ${newQty}.`);
      }
    } catch (e) {
      console.error("Failed to update item quantity:", e);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (variantId: string) => {
    setRemovingItemId(variantId);
    try {
      await removeFromCart(variantId);
    } catch (e) {
      console.error("Failed to remove item:", e);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handlePromoApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setTimeout(() => {
      setIsApplyingPromo(false);
      toast.info(`Promo code "${promoCode.toUpperCase()}" is currently undergoing authorization.`);
    }, 800);
  };

  // Luxury shipping progress parameters
  const shippingThreshold = 200;
  const subtotal = cart?.summary.subtotal || 0;
  const isFreeShipping = subtotal >= shippingThreshold;
  const remainingForFreeShipping = shippingThreshold - subtotal;
  const shippingProgressPercentage = Math.min((subtotal / shippingThreshold) * 100, 100);

  if (isLoading && !cart) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 min-h-[400px]">
        <Loader2 className="h-10 w-10 text-gold animate-spin stroke-[1.2]" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 mt-4 font-bold">
          Verifying your shopping bag selection...
        </p>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto space-y-6 min-h-[500px] animate-in fade-in duration-700">
        <div className="p-4 bg-stone-50 rounded-full border border-sand/10">
          <ShoppingBag className="h-10 w-10 text-stone-300 stroke-[1.2]" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl italic text-charcoal tracking-wide">
            Your Shopping Bag is Empty
          </h3>
          <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
            Explore the latest seasonal arrivals and find the perfect pair of bespoke Slipperze sandals to archive in your wardrobe.
          </p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal hover:bg-stone-800 text-cream text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          Browse Collection
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 animate-in fade-in duration-700">
      {/* Editorial Title Block */}
      <div className="border-b border-sand/10 pb-6 flex items-baseline justify-between">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-wide italic">
          Le Sac / Shopping Bag
        </h1>
        <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-bold">
          {cart?.summary.itemCount} {cart?.summary.itemCount === 1 ? "Item" : "Items"} Reserved
        </p>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="bg-stone-50 border border-sand/10 p-5 rounded-sm space-y-3">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold">
          <span className="text-charcoal flex items-center gap-2">
            <Truck className="h-4 w-4 text-gold stroke-[1.5]" />
            {isFreeShipping ? "You qualify for free shipping" : "Shipping Progress"}
          </span>
          <span className="text-gold">
            {isFreeShipping
              ? "Complimentary Shipping"
              : `Add $${remainingForFreeShipping.toFixed(2)} more for free worldwide delivery`}
          </span>
        </div>
        <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-1000 ease-out"
            style={{ width: `${shippingProgressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Pane - Shopping Bag Items (8 columns) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          <div className="divide-y divide-sand/10 border-b border-sand/10">
            {items.map((item) => {
              const imageUrl = item.product?.images?.[0]?.url;
              const resolvedImgSrc = imageUrl
                ? imageUrl.startsWith("http") || imageUrl.startsWith("/")
                  ? imageUrl
                  : imageKitUrl(imageUrl)
                : "/images/placeholder.png";

              return (
                <div
                  key={item.id}
                  className="py-6 sm:py-8 flex gap-4 sm:gap-6 items-start first:pt-0 last:pb-8 group relative"
                >
                  {/* Product Thumbnail */}
                  <div className="relative aspect-[3/4] w-24 sm:w-32 bg-stone-50 overflow-hidden border border-sand/10 rounded-sm flex-shrink-0">
                    <Link href={`/catalog/women/heeled-sandals/${item.product?.slug}`}>
                      <Image
                        src={resolvedImgSrc}
                        alt={item.product?.title || "Bespoke Sandal"}
                        fill
                        className="object-cover transition-all duration-[2000ms] ease-editorial group-hover:scale-105"
                        sizes="(max-width: 768px) 150px, 200px"
                      />
                    </Link>
                  </div>

                {/* Product Meta & Adjustments */}
                <div className="flex-grow flex flex-col justify-between min-h-[120px] sm:min-h-[160px]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-serif text-[14px] sm:text-[16px] tracking-wide text-charcoal font-bold uppercase truncate max-w-[80%] hover:text-gold transition-colors">
                        <Link href={`/catalog/women/heeled-sandals/${item.product?.slug}`}>
                          {item.product?.title}
                        </Link>
                      </h3>
                      <p className="text-[13px] sm:text-[14px] font-bold text-charcoal tracking-tighter whitespace-nowrap">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-600 font-bold">
                      <span className="text-charcoal/95">Color: {item.variant?.color || "Noir"}</span>
                      <span className="h-1 w-1 bg-stone-300 rounded-full" />
                      <span className="text-gold">Size: {item.variant?.size}</span>
                      <span className="h-1 w-1 bg-stone-300 rounded-full" />
                      <span className="text-stone-500">SKU: {item.variant?.sku.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-sand/5">
                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center border border-sand/20 bg-stone-50 rounded-sm">
                      <button
                        type="button"
                        disabled={updatingItemId === item.variantId || removingItemId === item.variantId}
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="p-2 text-stone-400 hover:text-charcoal disabled:text-stone-200 hover:bg-stone-100 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-[11px] font-bold text-charcoal">
                        {updatingItemId === item.variantId ? (
                          <Loader2 className="h-3 w-3 animate-spin mx-auto text-gold" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={updatingItemId === item.variantId || removingItemId === item.variantId}
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="p-2 text-stone-400 hover:text-charcoal disabled:text-stone-200 hover:bg-stone-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Exclude Item Button */}
                    <button
                      type="button"
                      disabled={updatingItemId === item.variantId || removingItemId === item.variantId}
                      onClick={() => handleRemove(item.variantId)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 border border-transparent hover:border-burgundy/10 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-stone-600 hover:text-burgundy hover:bg-burgundy/[0.02] rounded-sm transition-all duration-300"
                    >
                      {removingItemId === item.variantId ? (
                        <Loader2 className="h-3 w-3 animate-spin text-burgundy" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Luxury Re-assurances footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="border border-sand/10 bg-ivory/20 p-4 flex gap-3 items-center rounded-sm">
              <ShieldCheck className="h-8 w-8 text-gold stroke-[1.2]" />
              <div className="space-y-0.5">
                <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-charcoal">
                  100% Encrypted Transactions
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-stone-400">
                  Fully verified premium card validation.
                </p>
              </div>
            </div>
            <div className="border border-sand/10 bg-ivory/20 p-4 flex gap-3 items-center rounded-sm">
              <Truck className="h-8 w-8 text-gold stroke-[1.2]" />
              <div className="space-y-0.5">
                <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-charcoal">
                  Artisanal Custom Delivery
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-stone-400">
                  Hand-crafted packaging with priority courier routing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane - Summary panel (4 columns) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8 bg-stone-50/40 p-6 sm:p-8 border border-sand/10 rounded-sm">
          <h3 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide italic pb-4 border-b border-sand/10">
            Order Ledger
          </h3>

          <div className="space-y-4 text-[11px] sm:text-[12px] uppercase tracking-wider text-stone-500 font-bold border-b border-sand/10 pb-6">
            <div className="flex justify-between items-center">
              <span>Items Total</span>
              <span className="text-charcoal font-bold">${cart?.summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Priority Delivery</span>
              <span className="text-charcoal font-bold">
                {isFreeShipping ? "FREE" : `$${(cart?.summary.shippingAmount || 15).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sales Tax</span>
              <span className="text-stone-400">Calculated at Checkout</span>
            </div>
            {cart?.summary.totalDiscount && cart.summary.totalDiscount > 0 ? (
              <div className="flex justify-between items-center text-gold">
                <span>Promotional Discount</span>
                <span>-${cart.summary.totalDiscount.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {/* Promo code entry */}
          <form onSubmit={handlePromoApply} className="space-y-2 pb-6 border-b border-sand/10">
            <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-stone-400 block">
              Do you have a personal Privilege Code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. SLIPPERZE10"
                className="flex-grow p-3 text-[10px] bg-white border border-sand/20 focus:border-gold outline-none rounded-none tracking-widest uppercase"
              />
              <button
                type="submit"
                disabled={isApplyingPromo}
                className="px-4 bg-charcoal hover:bg-stone-800 text-cream text-[9px] uppercase tracking-[0.2em] font-bold rounded-none transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                {isApplyingPromo ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Percent className="h-3 w-3" />
                )}
                Apply
              </button>
            </div>
          </form>

          {/* Absolute Order Total */}
          <div className="flex justify-between items-baseline py-4 border-b border-sand/10">
            <span className="font-serif text-lg text-charcoal tracking-wide italic">
              Estimated Total
            </span>
            <span className="text-2xl font-bold text-charcoal tracking-tighter">
              ${(cart?.summary.total || 0).toFixed(2)}
            </span>
          </div>

          {/* Checkout CTA */}
          <div className="space-y-4 pt-2">
            <button
              onClick={() => {
                toast.success("Navigating securely to Slipperze checkout portal...");
                window.location.href = "/checkout"; // redirecting to secure checkout portal
              }}
              className="w-full h-14 bg-charcoal hover:bg-stone-700 text-cream hover:text-white uppercase tracking-[0.3em] hover:tracking-[0.4em] text-[11px] font-bold rounded-none shadow-lg transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              Secure Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/catalog"
              className="block text-center text-[10px] uppercase tracking-[0.25em] text-stone-400 hover:text-charcoal transition-colors underline underline-offset-4"
            >
              Continue curating collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
