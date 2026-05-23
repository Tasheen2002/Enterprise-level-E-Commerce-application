"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Globe, Sparkles, AlertCircle, HelpCircle, Image as ImageIcon, Layers } from "lucide-react";
import { api } from "../../lib/api-client";
import { toast } from "sonner";
import { imageKitUrl } from "../../lib/imagekit";
import Link from "next/link";

interface Category {
  id: string;
  title: string;
  slug: string;
}

interface Product {
  id?: string;
  title: string;
  slug: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: string[];
  sizes?: { value: string; isAvailable: boolean }[];
  images?: string[];
}

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Product) => Promise<void>;
  categories: Category[];
}

export function ProductDrawer({ isOpen, onClose, product, onSave, categories }: ProductDrawerProps) {
  const [activeTab, setActiveTab] = useState<"general" | "variants" | "seo">("general");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [formData, setFormData] = useState<Product>({
    title: "",
    slug: "",
    brand: "Tasheen",
    shortDesc: "",
    longDescHtml: "",
    status: "DRAFT",
    price: 0,
    compareAtPrice: null,
    currency: "USD",
    seoTitle: "",
    seoDescription: "",
    categoryIds: [],
    sizes: [
      { value: "35", isAvailable: true },
      { value: "36", isAvailable: true },
      { value: "37", isAvailable: true },
      { value: "38", isAvailable: true },
      { value: "39", isAvailable: true },
      { value: "40", isAvailable: true },
      { value: "41", isAvailable: true },
      { value: "42", isAvailable: true },
    ],
    images: [],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load product data when opened
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        brand: product.brand || "Tasheen",
        categoryIds: product.categoryIds || [],
        images: product.images || [],
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        brand: "Tasheen",
        shortDesc: "",
        longDescHtml: "",
        status: "DRAFT",
        price: 0,
        compareAtPrice: null,
        currency: "USD",
        seoTitle: "",
        seoDescription: "",
        categoryIds: [],
        images: [],
      });
    }
    setActiveTab("general");
  }, [product, isOpen]);

  // Handle auto slug and SEO title generation
  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      title,
      slug: product ? prev.slug : slug, // Don't overwrite slug when editing an existing product
      seoTitle: product ? prev.seoTitle : title,
    }));
  };

  const handleSizeToggle = (index: number) => {
    const currentSizes = formData.sizes;
    if (!currentSizes) return;
    const newSizes = [...currentSizes];
    if (newSizes[index]) {
      newSizes[index].isAvailable = !newSizes[index].isAvailable;
    }
    setFormData((prev) => ({ ...prev, sizes: newSizes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Product Title is required.");
      return;
    }
    if (!formData.slug) {
      toast.error("Product URL Slug is required.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success(product ? "Product updated successfully" : "Product created successfully");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save product details");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/60 transition-opacity duration-500" 
        onClick={onClose}
      />

      {/* Modal Body */}
      <div className="relative w-full max-w-[720px] max-h-[85vh] bg-[#F5F1E8] shadow-2xl flex flex-col z-10 border border-charcoal/5 rounded-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-charcoal/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-charcoal">
              {product ? "Edit Product Details" : "Commission New Product"}
            </h2>
            <p className="text-[9px] font-bold text-charcoal/40 uppercase tracking-widest mt-0.5">
              {product ? `ID: ${product.id}` : "Boutique Catalog Registration"}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal/40 hover:text-charcoal transition-all hover:bg-charcoal/5"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="px-8 border-b border-charcoal/5 flex gap-6 bg-[#EBE6D9]/30">
          {(["general", "variants", "seo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-[10px] font-bold uppercase tracking-[0.2em] relative transition-colors ${
                activeTab === tab ? "text-burgundy" : "text-charcoal/50 hover:text-charcoal"
              }`}
            >
              {tab === "general" && "General Details"}
              {tab === "variants" && "Sizes & Swatches"}
              {tab === "seo" && "SEO & Google Search"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-burgundy" />
              )}
            </button>
          ))}
        </div>

        {/* Drawer Content Scroll Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 no-scrollbar">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Product Identity Card */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Product Identity</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Product Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. PIPER SANDALS"
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block flex items-center gap-1.5">
                      URL Slug 
                      <span title="Websafe name used in browser address bars">
                        <HelpCircle className="w-3 h-3 text-charcoal/30 cursor-help" />
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      placeholder="piper-sandals"
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Tasheen"
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Boutique Category</label>
                    <select
                      value={formData.categoryIds?.[0] || ""}
                      onChange={(e) => setFormData({ ...formData, categoryIds: e.target.value ? [e.target.value] : [] })}
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Short Description</label>
                  <textarea
                    value={formData.shortDesc}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    placeholder="Brief high-level description for catalog grid tooltips..."
                    rows={2}
                    className="w-full bg-[#F9F8F4] border border-charcoal/10 p-3 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors resize-none rounded-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Detailed Narrative Description</label>
                  <textarea
                    value={formData.longDescHtml}
                    onChange={(e) => setFormData({ ...formData, longDescHtml: e.target.value })}
                    placeholder="Full product editorial story, craftsmanship details, sizing guidance..."
                    rows={4}
                    className="w-full bg-[#F9F8F4] border border-charcoal/10 p-3 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors rounded-sm"
                  />
                </div>
              </div>

              {/* Product Pricing Card */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Pricing & Currencies</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Boutique Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-xs">$</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="230"
                        className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-7 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Compare At Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-xs">$</span>
                      <input
                        type="number"
                        min={0}
                        value={formData.compareAtPrice || ""}
                        onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="e.g. 290"
                        className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-7 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Base Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    >
                      <option value="USD">US$ (USD)</option>
                      <option value="SGD">S$ (SGD)</option>
                      <option value="EUR">€ (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="space-y-6">
              {/* Product Variants Link Card */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Physical Variants</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-charcoal/70">
                      Configure individual size swatches, custom SKUs, barcodes, and preorder settings for this product.
                    </p>
                  </div>
                  {formData.id ? (
                    <Link
                      href={`/products/${formData.id}/variants`}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-burgundy hover:bg-burgundy/90 text-cream text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm whitespace-nowrap"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Manage Variants
                    </Link>
                  ) : (
                    <span className="text-[10px] font-bold text-burgundy bg-burgundy/5 border border-burgundy/10 px-3 py-2 rounded-sm text-center">
                      Save product first to commission variants
                    </span>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Catalog Visibility</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all rounded-sm ${
                        formData.status === status
                          ? "bg-charcoal text-cream border-charcoal"
                          : "border-charcoal/10 text-charcoal/60 hover:border-charcoal/30 hover:bg-charcoal/[0.02]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>



              {/* Media Gallery Assets Card */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Media Gallery Configuration</h3>
                
                {formData.images && formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-charcoal/5 bg-[#F5F1E8] aspect-[4/3] flex items-center justify-center">
                        <img 
                          src={img.startsWith("http") ? img : imageKitUrl(img)} 
                          alt={`Product media ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-charcoal/80 text-cream text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
                          {idx === 0 ? "Primary" : idx === 1 ? "Hover" : `Detail ${idx - 1}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImgs = formData.images?.filter((_, i) => i !== idx);
                            setFormData({ ...formData, images: newImgs });
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-charcoal/20 rounded-xl p-10 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-charcoal/[0.02] border border-charcoal/5 flex items-center justify-center text-charcoal/30">
                      <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/60">No Media Loaded</p>
                      <p className="text-[9px] text-charcoal/40 mt-1 max-w-[280px] leading-relaxed">
                        No custom image assets configured yet for this product.
                      </p>
                    </div>
                  </div>
                )}

                {/* Advanced Image Input Options */}
                <div className="border-t border-charcoal/5 pt-6 mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60">Add New Media Asset</h4>
                    <span className="text-[8px] text-charcoal/40 font-medium">Supports JPG, PNG, WebP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Add by URL */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-charcoal/50 font-bold block">Asset URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="new-image-url"
                          placeholder="https://ik.imagekit.io/..."
                          className="flex-1 bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2 text-[11px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const url = input.value.trim();
                              if (url) {
                                setFormData(prev => ({
                                  ...prev,
                                  images: [...(prev.images || []), url]
                                }));
                                input.value = "";
                                toast.success("Asset URL added to gallery");
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("new-image-url") as HTMLInputElement;
                            const url = input?.value.trim();
                            if (url) {
                              setFormData(prev => ({
                                ...prev,
                                  images: [...(prev.images || []), url]
                              }));
                              input.value = "";
                              toast.success("Asset URL added to gallery");
                            } else {
                              toast.error("Please enter a valid URL");
                            }
                          }}
                          className="bg-charcoal text-cream px-4 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-burgundy transition-colors rounded-sm shadow-sm"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Local File Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-charcoal/50 font-bold block">Local File Upload</label>
                      <label className="flex items-center justify-center gap-2 border border-dashed border-charcoal/20 hover:border-burgundy/30 bg-[#F9F8F4] py-2 px-3 rounded-sm cursor-pointer hover:bg-charcoal/[0.01] transition-all">
                        <ImageIcon className="w-3.5 h-3.5 text-charcoal/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Choose Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                setFormData(prev => ({
                                  ...prev,
                                  images: [...(prev.images || []), base64String]
                                }));
                                toast.success("Image file uploaded successfully");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-6">
              {/* Google Live Search Preview */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" /> Live Google Search Preview
                  </h3>
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">SEO Preview</span>
                </div>

                <div className="border border-charcoal/5 p-5 rounded-xl bg-slate-50 font-sans space-y-1.5 shadow-inner">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>https://tasheen.com</span>
                    <span>›</span>
                    <span>catalog</span>
                    <span>›</span>
                    <span>{formData.slug || "product-url"}</span>
                  </div>
                  <h4 className="text-[16px] text-blue-800 font-medium hover:underline cursor-pointer leading-tight">
                    {formData.seoTitle || formData.title || "Product Title - Premium E-Commerce Store"}
                  </h4>
                  <p className="text-[12px] text-slate-600 leading-relaxed max-w-[500px]">
                    {formData.seoDescription || formData.shortDesc || "Discover the premium artisanal boutique shoes collection. Carefully hand-crafted and detailed with luxury leather. Shop online at Tasheen."}
                  </p>
                </div>
              </div>

              {/* SEO Config Fields */}
              <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-burgundy" /> Meta Tags Curation
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">SEO Meta Title</label>
                      <span className="text-[8px] text-charcoal/30">{(formData.seoTitle || "").length} / 60 chars</span>
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="e.g. Premium Piper Sandals - Tasheen"
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">SEO Meta Description</label>
                      <span className="text-[8px] text-charcoal/30">{(formData.seoDescription || "").length} / 160 chars</span>
                    </div>
                    <textarea
                      maxLength={160}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="e.g. Shop the elegant hand-detailed Piper Sandals in Mocha Dots. Free international shipping on premium leather goods."
                      rows={3}
                      className="w-full bg-[#F9F8F4] border border-charcoal/10 p-3 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors rounded-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-charcoal/5 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-charcoal/30" />
            <span>Audit log ready</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-charcoal/20 px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-charcoal text-cream px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-all duration-500 rounded-sm shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
