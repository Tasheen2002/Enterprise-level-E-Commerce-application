"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserListItem } from "../types";
import { customersApi } from "../api";
import { imageKitUrl } from "../../../lib/imagekit";
import { Heart, Loader2, Lock, Globe, Layers } from "lucide-react";
import { toast } from "sonner";

interface CustomerWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UserListItem | null;
}

interface EnrichedWishlistItem {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  currency: string;
  image: string;
  stock: number;
}

export const CustomerWishlistModal: React.FC<CustomerWishlistModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [items, setItems] = useState<EnrichedWishlistItem[]>([]);
  
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Load lists when customer changes
  useEffect(() => {
    if (!isOpen || !customer) return;

    const loadLists = async () => {
      setLoadingLists(true);
      setWishlists([]);
      setItems([]);
      setSelectedListId("");
      try {
        const lists = await customersApi.getCustomerWishlists(customer.id);
        setWishlists(lists);
        
        const defaultList = lists.find((l) => l.isDefault) || lists[0];
        if (defaultList) {
          setSelectedListId(defaultList.id);
        }
      } catch (err: any) {
        console.error("Failed to load customer wishlists:", err);
        toast.error("Failed to load customer wishlist registry.");
      } finally {
        setLoadingLists(false);
      }
    };

    loadLists();
  }, [isOpen, customer]);

  // Load and enrich items when selected list changes
  useEffect(() => {
    if (!isOpen || !selectedListId) return;

    const loadItems = async () => {
      setLoadingItems(true);
      setItems([]);
      try {
        const rawItems = await customersApi.getWishlistItems(selectedListId);
        
        const enriched = await Promise.all(
          rawItems.map(async (item: any) => {
            try {
              const variantId = item.variantId;
              const variant = await customersApi.getVariant(variantId);
              if (!variant) return null;
              
              const product = await customersApi.getProduct(variant.productId);
              if (!product) return null;

              const [mediaAssets, stock] = await Promise.all([
                customersApi.getVariantMedia(variantId),
                customersApi.getVariantStock(variantId),
              ]);

              const firstMedia = mediaAssets?.[0]?.storageKey;
              const imageUrl = firstMedia
                ? (firstMedia.startsWith("http") ? firstMedia : imageKitUrl(firstMedia))
                : (product.images?.[0]
                  ? (product.images[0].startsWith("http") ? product.images[0] : imageKitUrl(product.images[0]))
                  : imageKitUrl("profile.jpg"));

              return {
                id: item.id,
                variantId,
                productId: variant.productId,
                name: product.title,
                color: variant.color || product.brand || "Mocha Dots",
                size: variant.size || "",
                sku: variant.sku || "N/A",
                price: product.price,
                currency: product.currency === "EUR" ? "€" : "US$",
                image: imageUrl,
                stock,
              } as EnrichedWishlistItem;
            } catch (err) {
              console.error("Failed to enrich wishlist item detail", err);
              return null;
            }
          })
        );

        setItems(enriched.filter((i): i is EnrichedWishlistItem => i !== null));
      } catch (err: any) {
        console.error("Failed to load wishlist items:", err);
        toast.error("Failed to load items in selected collection.");
      } finally {
        setLoadingItems(false);
      }
    };

    loadItems();
  }, [isOpen, selectedListId]);

  if (!isMounted || !isOpen || !customer) return null;

  const currentList = wishlists.find((l) => l.id === selectedListId);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Solid Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#FCFBF8] border border-charcoal/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#FBF9F5] border-b border-charcoal/10 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-serif italic text-charcoal">
              Customer Preference Auditor
            </h3>
            <p className="text-[9px] uppercase tracking-[0.25em] text-charcoal/40 font-bold mt-1">
              Auditing: {customer.firstName ? `${customer.firstName} ${customer.lastName}` : "Anonymous Member"} ({customer.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal text-lg font-light leading-none p-2 transition-all hover:rotate-90 duration-300"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6 ts-scrollbar-bold">
          {loadingLists ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 text-gold animate-spin stroke-[1.5]" />
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 mt-3 font-bold">
                Resolving collections ledger...
              </p>
            </div>
          ) : wishlists.length === 0 ? (
            <div className="text-center py-16 px-6 border border-dashed border-[#C5A059]/20 bg-white/40 rounded-lg max-w-md mx-auto space-y-5 animate-in fade-in duration-700">
              <div className="p-4 bg-[#FBF9F5] rounded-full border border-[#C5A059]/10 inline-block">
                <Heart className="h-8 w-8 text-[#C5A059]/40 stroke-[0.8]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg italic text-charcoal tracking-wide">
                  No Curated Wishlists Found
                </h3>
                <p className="text-[10px] text-charcoal/40 uppercase tracking-[0.2em] leading-relaxed font-bold">
                  This member has not yet saved any style archives or custom collections.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dropdown Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#F9F8F4] border border-charcoal/5 rounded-lg shadow-sm">
                <div className="space-y-2">
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">
                    Active Wishlist Collection
                  </label>
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="bg-white border border-charcoal/10 rounded-lg px-4 py-2.5 text-xs text-charcoal focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] min-w-[240px] shadow-sm font-medium transition-all"
                  >
                    {wishlists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} {list.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {currentList && (
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#C5A059] font-bold bg-white border border-[#C5A059]/10 px-3.5 py-2 rounded-full shadow-sm">
                    {currentList.isPublic ? (
                      <>
                        <Globe className="h-3.5 w-3.5 text-[#C5A059]" />
                        <span>Public Collection</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5 text-stone-400" />
                        <span className="text-stone-500">Private Collection</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-charcoal/70 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#C5A059]" />
                  Curated Style Variants
                </h4>

                {loadingItems ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 text-gold animate-spin stroke-[1.5]" />
                    <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 mt-3 font-bold">
                      Enriching variant media & stock...
                    </p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-charcoal/10 rounded-lg bg-white/40 space-y-3">
                    <Heart className="h-6 w-6 text-stone-300 mx-auto stroke-[1]" />
                    <p className="text-stone-400 text-xs italic">
                      This collection contains no curated items.
                    </p>
                  </div>
                ) : (
                  <div className="border border-charcoal/5 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-charcoal/[0.02] border-b border-charcoal/5 text-[9px] uppercase tracking-widest text-charcoal/50 font-bold">
                          <th className="px-5 py-3.5">Style Variant</th>
                          <th className="px-5 py-3.5">SKU</th>
                          <th className="px-5 py-3.5">Size</th>
                          <th className="px-5 py-3.5">Price</th>
                          <th className="px-5 py-3.5">Inventory Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal/5 text-xs text-charcoal/80">
                        {items.map((item) => {
                          const isOutOfStock = item.stock <= 0;
                          const isLowStock = item.stock > 0 && item.stock <= 5;
                          
                          return (
                            <tr key={item.id} className="hover:bg-charcoal/[0.01] transition-colors duration-200">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-12 bg-[#F9F8F4] overflow-hidden shrink-0 border border-charcoal/5 rounded-md shadow-sm">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-serif italic text-[12px] font-bold text-charcoal">
                                      {item.name}
                                    </div>
                                    <div className="text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">
                                      Color: {item.color}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono text-[10px] text-charcoal/60">
                                {item.sku}
                              </td>
                              <td className="px-5 py-4 font-bold text-[#C5A059]">
                                {item.size}
                              </td>
                              <td className="px-5 py-4 font-bold text-charcoal">
                                {item.currency} {item.price}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-block text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${
                                    isOutOfStock
                                      ? "text-red-600 bg-red-50 border-red-100"
                                      : isLowStock
                                      ? "text-amber-600 bg-amber-50 border-amber-100"
                                      : "text-green-600 bg-green-50 border-green-100"
                                  }`}
                                >
                                  {isOutOfStock
                                    ? "Out of Stock"
                                    : isLowStock
                                    ? `Low Stock (${item.stock})`
                                    : `Available (${item.stock})`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FBF9F5] border-t border-charcoal/10 px-8 py-5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 border border-charcoal/20 hover:border-[#C5A059] bg-charcoal hover:bg-[#C5A059] text-[#F5F1E8] text-[9px] font-bold uppercase tracking-[0.25em] transition-all duration-500 rounded-full shadow-sm cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
