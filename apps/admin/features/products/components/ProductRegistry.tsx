"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Trash2, Edit2, ShoppingBag, RefreshCw, Layers } from "lucide-react";
import { imageKitUrl } from "../../../lib/imagekit";
import { Category, Product } from "../types";
import { useAdminReviews } from "../hooks/useAdminReviews";

interface ProductRegistryProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAddNew: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProductRegistry({
  products,
  categories,
  onEdit,
  onDelete,
  onAddNew,
  isLoading,
  onRefresh,
}: ProductRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");

  const { reviews } = useAdminReviews();

  const getProductRatingStats = (productId: string) => {
    const productReviews = reviews.filter((r) => r.productId === productId && r.status === "approved");
    if (productReviews.length === 0) return null;
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    return {
      average: parseFloat(avg.toFixed(1)),
      count: productReviews.length,
    };
  };

  // Filter products based on search query and dropdown selections
  const filteredProducts = products.filter((product) => {
    // 1. Text Search
    const searchString = `${product.title} ${product.brand || ""} ${product.slug}`.toLowerCase();
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Status Filter
    if (statusFilter !== "ALL" && product.status !== statusFilter) {
      return false;
    }

    // 3. Stock Health Filter
    if (product.sizes) {
      const availableCount = product.sizes.filter((s) => s.isAvailable).length;
      if (stockFilter === "OUT_OF_STOCK" && availableCount > 0) {
        return false;
      }
      if (stockFilter === "LOW_STOCK" && (availableCount === 0 || availableCount > 3)) {
        // Low stock defined as having 1 to 3 sizes remaining in stock
        return false;
      }
      if (stockFilter === "IN_STOCK" && availableCount === 0) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-700 border-emerald-500/10";
      case "DRAFT":
        return "bg-burgundy/5 text-burgundy border-burgundy/10";
      case "SCHEDULED":
        return "bg-amber-50 text-amber-700 border-amber-500/10";
      case "ARCHIVED":
      default:
        return "bg-charcoal/5 text-charcoal/50 border-charcoal/10";
    }
  };

  const getStockSummary = (product: Product) => {
    if (!product.sizes) return { label: "Unknown", color: "text-charcoal/40" };
    const availableCount = product.sizes.filter((s) => s.isAvailable).length;

    if (availableCount === 0) {
      return { label: "Out of Stock", color: "text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider" };
    }
    if (availableCount <= 3) {
      return { label: `Low Stock (${availableCount} left)`, color: "text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider" };
    }
    return { label: "Healthy", color: "text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider" };
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        
        {/* Left Side: Search and Filters */}
        <div className="w-full lg:flex-1 flex flex-col sm:flex-row gap-3">
          
          {/* Text Search */}
          <div className="relative flex-1 min-w-[160px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog by title, brand, or slug..."
              className="w-full bg-[#F9F8F4] border border-charcoal/10 pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-charcoal focus:outline-none focus:border-burgundy rounded-xl transition-colors"
            />
          </div>

          {/* Visibility Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231c1917' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
              backgroundPosition: "right 18px center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "11px",
            }}
            className="w-full sm:w-[170px] shrink-0 bg-[#F9F8F4] border border-charcoal/10 pl-3.5 pr-10 py-2.5 text-[10px] font-bold uppercase tracking-normal text-charcoal focus:outline-none focus:border-burgundy rounded-xl transition-colors cursor-pointer appearance-none"
          >
            <option value="ALL">All Visibilities</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Stock Health Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231c1917' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
              backgroundPosition: "right 18px center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "11px",
            }}
            className="w-full sm:w-[170px] shrink-0 bg-[#F9F8F4] border border-charcoal/10 pl-3.5 pr-10 py-2.5 text-[10px] font-bold uppercase tracking-normal text-charcoal focus:outline-none focus:border-burgundy rounded-xl transition-colors cursor-pointer appearance-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out Of Stock</option>
          </select>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={onRefresh}
            title="Refresh database catalog list"
            className="border border-charcoal/10 hover:border-charcoal/20 bg-[#F9F8F4] p-3 text-charcoal hover:bg-charcoal/5 rounded-xl transition-colors flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onAddNew}
            className="bg-charcoal hover:bg-burgundy text-cream px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all duration-500 rounded-xl flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Commission Product</span>
          </button>
        </div>
      </div>
      {/* Main Catalog luxury registry grid */}
      <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-charcoal/5 bg-[#EBE6D9]/40">
                <th className="py-4 pl-6 pr-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Thumbnail</th>
                <th className="py-4 pl-4 pr-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Product Name</th>
                <th className="py-4 px-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Brand</th>
                <th className="py-4 px-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Retail Price</th>
                <th className="py-4 px-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Visibility</th>
                <th className="py-4 px-4 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Stock Health</th>
                <th className="py-4 pl-4 pr-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-charcoal/10 border-t-burgundy rounded-full animate-spin" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40">Querying product database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stockSummary = getStockSummary(product);
                  const firstImage = product.images?.[0];
                  const thumbnail = firstImage
                    ? (firstImage.startsWith("http") ? firstImage : imageKitUrl(firstImage))
                    : imageKitUrl("profile.jpg");
                  
                  return (
                    <tr key={product.id || product.slug} className="hover:bg-[#F9F8F4]/60 transition-colors group">
                      
                      {/* Image Thumbnail with fine luxury border ring */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-charcoal/10 bg-[#F5F1E8] shadow-sm flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = imageKitUrl("cat-heeled-sandals.png");
                            }}
                          />
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-4 pl-4 pr-4">
                        <div className="font-serif text-[13px] text-charcoal font-medium group-hover:text-burgundy transition-colors">
                          {product.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-charcoal/40 font-mono">
                            /{product.slug}
                          </span>
                          {(() => {
                            const stats = getProductRatingStats(product.id || "");
                            if (!stats) return null;
                            return (
                              <>
                                <span className="text-charcoal/20">|</span>
                                <span className="flex items-center gap-0.5 text-[#E6B342] text-[10px] font-bold">
                                  <span>★</span>
                                  <span className="text-charcoal/70">{stats.average}</span>
                                  <span className="text-charcoal/45 font-normal">({stats.count})</span>
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/70 bg-charcoal/[0.03] px-2.5 py-1 rounded-sm border border-charcoal/5">
                          {product.brand || "Slipperze"}
                        </span>
                      </td>

                      {/* Pricing Display */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[12px] font-bold text-charcoal">
                            {product.price ? `${product.currency === "EUR" ? "€" : "US$"}${product.price.toFixed(2)}` : "—"}
                          </span>
                          {product.compareAtPrice && (
                            <span className="font-mono text-[10px] line-through text-charcoal/40">
                              {product.currency === "EUR" ? "€" : "US$"}{product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Visibility tag */}
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadgeStyles(product.status)}`}>
                          {product.status}
                        </span>
                      </td>

                      {/* Stock summary */}
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className={stockSummary.color}>{stockSummary.label}</span>
                        </div>
                      </td>

                      {/* Inline Hover Action Items */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Link
                            href={`/products/${product.id}/variants`}
                            className="p-2 border border-charcoal/10 hover:border-charcoal/30 bg-white hover:bg-[#EBE6D9]/20 text-charcoal/60 hover:text-burgundy rounded-full transition-all flex items-center justify-center shrink-0"
                            title="Manage Variants"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => onEdit(product)}
                            className="p-2 border border-charcoal/10 hover:border-charcoal/30 bg-white hover:bg-[#EBE6D9]/20 text-charcoal/60 hover:text-burgundy rounded-full transition-all"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(product.id || "")}
                            className="p-2 border border-red-100 hover:border-red-200 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-charcoal/[0.02] border border-charcoal/5 flex items-center justify-center text-charcoal/30">
                        <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-[12px] font-bold uppercase tracking-widest text-charcoal/60">Registry Catalog Empty</h4>
                      <p className="text-[10px] text-charcoal/40 max-w-[280px] leading-relaxed">
                        No product matches found. Try adjusting your filter constraints or commissioning a new style.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Catalog Statistics Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-charcoal/5 bg-[#EBE6D9]/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
            <span>Showing {filteredProducts.length} premium products</span>
            <span>Slipperze E-Commerce Registry v1.0</span>
          </div>
        )}
      </div>
    </div>
  );
}
