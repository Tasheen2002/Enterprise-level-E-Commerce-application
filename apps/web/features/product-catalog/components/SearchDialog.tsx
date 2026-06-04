"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  X,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Container, cn } from "@tasheen/ui";
import { ProductCard } from "@/features/product-catalog/components/ProductCard";
import {
  searchProducts,
  getSearchFilters,
  getSearchSuggestions,
  getProducts,
  getProductRootCategorySlug,
} from "@/features/product-catalog/api";
import type { Product, SearchFilter } from "@/features/product-catalog/api";

/* ─────────────────────────── Types ─────────────────────────── */

interface SearchDialogProps {
  onClose: () => void;
}

type SortByValue = "relevance" | "price" | "title" | "createdAt";
type SortOrderValue = "asc" | "desc";
type AccordionKey = "availability" | "gender" | "color" | "collection" | "price";

/* ═══════════════════════════════════════════════════════════════
   SearchDialog — In‑place search workspace overlay
   ═══════════════════════════════════════════════════════════════ */

export function SearchDialog({ onClose }: SearchDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Query & search results state ── */
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]);

  /* ── Suggestion pills ── */
  const [suggestions, setSuggestions] = useState<
    { type: string; value: string; label: string }[]
  >([]);

  /* ── Filter & sorting state ── */
  const [availableFilters, setAvailableFilters] = useState<SearchFilter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedGender, setSelectedGender] = useState<"woman" | "man" | "">("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(undefined);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortByValue>("relevance");
  const [sortOrder, setSortOrder] = useState<SortOrderValue>("desc");

  /* ── UI state ── */
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<Record<AccordionKey, boolean>>({
    availability: true,
    gender: true,
    color: true,
    collection: true,
    price: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = debouncedQuery.trim().length > 0;

  /* ───────────────── Helpers ───────────────── */

  const toggleAccordion = (key: AccordionKey) =>
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleClearAllFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedGender("");
    setInStockOnly(false);
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMinPrice(undefined);
    setAppliedMaxPrice(undefined);
    setSortBy("relevance");
    setSortOrder("desc");
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedMinPrice(minPriceInput ? parseFloat(minPriceInput) : undefined);
    setAppliedMaxPrice(maxPriceInput ? parseFloat(maxPriceInput) : undefined);
  };

  const handleSortChange = (value: string) => {
    if (value === "price_asc") { setSortBy("price"); setSortOrder("asc"); }
    else if (value === "price_desc") { setSortBy("price"); setSortOrder("desc"); }
    else if (value === "newest") { setSortBy("createdAt"); setSortOrder("desc"); }
    else { setSortBy("relevance"); setSortOrder("desc"); }
  };

  const handleLoadMore = () => setCurrentPage((p) => p + 1);

  /* ───────────── Effects ───────────── */

  // Autofocus & keyboard/scroll locking
  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Debounce query → debouncedQuery (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedCategory, selectedBrand, selectedGender, inStockOnly, appliedMinPrice, appliedMaxPrice, sortBy, sortOrder]);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery) { setSuggestions([]); return; }
    let active = true;
    (async () => {
      try {
        const s = await getSearchSuggestions(debouncedQuery, { limit: 6 });
        if (active) setSuggestions(s);
      } catch { if (active) setSuggestions([]); }
    })();
    return () => { active = false; };
  }, [debouncedQuery]);

  // Fetch filters
  useEffect(() => {
    if (!debouncedQuery) { setAvailableFilters([]); return; }
    let active = true;
    (async () => {
      try {
        const f = await getSearchFilters(debouncedQuery, selectedCategory || undefined);
        if (active) setAvailableFilters(f);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [debouncedQuery, selectedCategory]);

  // Fetch products
  useEffect(() => {
    if (!debouncedQuery) {
      setProducts([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const res = await searchProducts(debouncedQuery, {
          page: currentPage,
          limit: 12,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          minPrice: appliedMinPrice,
          maxPrice: appliedMaxPrice,
          sortBy,
          sortOrder,
        });
        if (!active) return;
        if (currentPage === 1) setProducts(res.items);
        else setProducts((prev) => [...prev, ...res.items]);
        setTotalResults(res.total);
        setHasMore(res.hasMore);
        setIsLoading(false);

        if (res.total === 0) {
          const fb = await getProducts("heeled-sandals");
          if (active) setFallbackProducts(fb.slice(0, 4));
        }
      } catch (err) {
        console.error("[SearchDialog] Search failed:", err);
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [debouncedQuery, currentPage, selectedCategory, selectedBrand, appliedMinPrice, appliedMaxPrice, sortBy, sortOrder]);

  // Local gender filter
  const displayedProducts = products.filter((p) => {
    if (!selectedGender) return true;
    const rootSlug = getProductRootCategorySlug(p.categoryIds);
    if (selectedGender === "woman") return rootSlug === "women";
    if (selectedGender === "man") return rootSlug === "men";
    return true;
  });

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  // ──────── Shared Search Header Bar ────────
  const searchHeader = (
    <div className="w-full bg-[#FDFBF7] border-b border-charcoal/5 flex flex-col shadow-sm z-20">
      <div className="w-full flex items-start justify-between px-6 sm:px-12 pt-8 pb-6">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={onClose}
          className="font-serif text-2xl tracking-[0.1em] text-charcoal mr-8 sm:mr-16 select-none hover:text-gold transition-colors duration-300 shrink-0 pt-1"
        >
          slipperze
        </Link>

        {/* Center: search form + pills */}
        <div className="flex-1 flex flex-col gap-3 max-w-4xl mr-8 sm:mr-16">
          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="w-full flex items-center gap-3 relative border-b border-charcoal/15 pb-2.5"
          >
            <Search className="h-5 w-5 text-charcoal/70 shrink-0" strokeWidth={1.2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent font-serif text-base sm:text-lg tracking-wide text-charcoal outline-none placeholder:text-charcoal/30 py-0.5 border-none"
            />
            {isLoading && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/60 animate-spin" />
            )}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => { setQuery(""); setDebouncedQuery(""); }}
                className="p-0.5 hover:text-gold transition-colors duration-300"
              >
                <X className="h-4 w-4 text-stone-400 hover:text-charcoal" strokeWidth={1.5} />
              </button>
            )}
          </form>

          {/* Suggestion pills + active query pill */}
          {debouncedQuery && (
            <div className="flex flex-wrap gap-2 animate-in fade-in duration-300 pl-8">
              {/* Active query pill */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-charcoal bg-white border border-charcoal/10 rounded-full shadow-sm animate-in zoom-in-95 duration-200">
                <span>{debouncedQuery}</span>
                <button
                  type="button"
                  onClick={() => { setQuery(""); setDebouncedQuery(""); }}
                  className="hover:text-gold transition-colors duration-300"
                >
                  <X className="h-3 w-3 text-stone-400 hover:text-charcoal" strokeWidth={2} />
                </button>
              </span>

              {/* Dynamic suggestion pills */}
              {suggestions.map((s, idx) => (
                <button
                  key={`${s.type}-${s.value}-${idx}`}
                  type="button"
                  onClick={() => setQuery(s.label)}
                  className="inline-flex items-center px-3.5 py-1 text-[10px] font-sans font-medium uppercase tracking-wider text-stone-500 bg-transparent border border-stone-200 rounded-full hover:border-charcoal hover:text-charcoal hover:bg-white transition-all duration-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 text-charcoal/60 hover:text-charcoal transition-colors duration-300 shrink-0 pt-1"
          aria-label="Close search"
        >
          <X className="h-6 w-6 hover:rotate-90 transition-transform duration-500" strokeWidth={1.2} />
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;

  /* ═════════════════════════════════════════════════════
     A) COMPACT STATE — no query yet
     ═════════════════════════════════════════════════════ */
  if (!isActive) {
    return createPortal(
      <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
        {/* Dimmed backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] cursor-pointer"
        />
        {/* Compact drawer */}
        <div className="relative z-10 animate-in slide-in-from-top-4 duration-300">
          {searchHeader}
        </div>
      </div>,
      document.body
    );
  }

  /* ═════════════════════════════════════════════════════
     B) EXPANDED STATE — full workspace with filters+grid
     ═════════════════════════════════════════════════════ */

  // ── Sidebar Accordion Block (reusable for both desktop and mobile) ──
  const renderFilters = (isMobile: boolean) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-sand/30">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
          Faceted Filters
        </span>
        {(selectedCategory || selectedBrand || selectedGender || inStockOnly || appliedMinPrice !== undefined || appliedMaxPrice !== undefined) && (
          <button
            onClick={() => { handleClearAllFilters(); if (isMobile) setMobileFiltersOpen(false); }}
            className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-burgundy transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Availability */}
      <div className="border-b border-sand/30 pb-4">
        <button
          onClick={() => toggleAccordion("availability")}
          className="w-full flex items-center justify-between text-left py-2 group"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
            Availability
          </span>
          {accordionOpen.availability
            ? <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
            : <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />}
        </button>
        {accordionOpen.availability && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => { setInStockOnly(!inStockOnly); if (isMobile) setMobileFiltersOpen(false); }}
              className={cn(
                "px-3 py-1.5 border text-[9px] font-bold uppercase tracking-wider rounded-full transition-all duration-300",
                inStockOnly
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white border-sand text-stone-500 hover:text-charcoal hover:border-stone-400"
              )}
            >
              in stock {inStockOnly && "✕"}
            </button>
          </div>
        )}
      </div>

      {/* Gender */}
      <div className="border-b border-sand/30 pb-4">
        <button
          onClick={() => toggleAccordion("gender")}
          className="w-full flex items-center justify-between text-left py-2 group"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
            Gender
          </span>
          {accordionOpen.gender
            ? <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
            : <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />}
        </button>
        {accordionOpen.gender && (
          <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            {(["woman", "man"] as const).map((g) => (
              <label key={g} className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedGender === g}
                    onChange={() => { setSelectedGender(selectedGender === g ? "" : g); if (isMobile) setMobileFiltersOpen(false); }}
                    className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium capitalize">{g === "woman" ? "Woman" : "Man"}</span>
                </div>
                <span className="text-[9px] text-stone-400 font-bold">{g === "woman" ? totalResults : 0}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color (brand) */}
      {availableFilters.find((f) => f.name === "brand") && (
        <div className="border-b border-sand/30 pb-4">
          <button
            onClick={() => toggleAccordion("color")}
            className="w-full flex items-center justify-between text-left py-2 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
              Color
            </span>
            {accordionOpen.color
              ? <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
              : <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />}
          </button>
          {accordionOpen.color && (
            <div className="pt-2 flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {availableFilters
                .find((f) => f.name === "brand")
                ?.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBrand === opt.value}
                        onChange={() => { setSelectedBrand(selectedBrand === opt.value ? "" : opt.value); if (isMobile) setMobileFiltersOpen(false); }}
                        className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium capitalize">{opt.label}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Collection (category) */}
      {availableFilters.find((f) => f.name === "category") && (
        <div className="border-b border-sand/30 pb-4">
          <button
            onClick={() => toggleAccordion("collection")}
            className="w-full flex items-center justify-between text-left py-2 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
              Collection
            </span>
            {accordionOpen.collection
              ? <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
              : <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />}
          </button>
          {accordionOpen.collection && (
            <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              {availableFilters
                .find((f) => f.name === "category")
                ?.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategory === opt.value}
                        onChange={() => { setSelectedCategory(selectedCategory === opt.value ? "" : opt.value); if (isMobile) setMobileFiltersOpen(false); }}
                        className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium capitalize">{opt.label}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="border-b border-sand/30 pb-4">
        <button
          onClick={() => toggleAccordion("price")}
          className="w-full flex items-center justify-between text-left py-2 group"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
            Price Range
          </span>
          {accordionOpen.price
            ? <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
            : <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />}
        </button>
        {accordionOpen.price && (
          <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <form onSubmit={(e) => { handleApplyPrice(e); if (isMobile) setMobileFiltersOpen(false); }} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min (£)"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full text-xs bg-white border border-sand py-2 px-3 text-charcoal outline-none placeholder:text-stone-300 rounded-sm"
                />
                <span className="text-stone-300">—</span>
                <input
                  type="number"
                  placeholder="Max (£)"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full text-xs bg-white border border-sand py-2 px-3 text-charcoal outline-none placeholder:text-stone-300 rounded-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-charcoal text-cream text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-white transition-all duration-300 rounded-sm"
              >
                Apply Filter
              </button>
            </form>

            {!isMobile && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "Under £200", min: undefined, max: 200 },
                  { label: "£200 - £500", min: 200, max: 500 },
                  { label: "Above £500", min: 500, max: undefined },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setMinPriceInput(preset.min !== undefined ? preset.min.toString() : "");
                      setMaxPriceInput(preset.max !== undefined ? preset.max.toString() : "");
                      setAppliedMinPrice(preset.min);
                      setAppliedMaxPrice(preset.max);
                    }}
                    className={cn(
                      "px-2.5 py-1.5 border border-sand text-[8px] font-bold uppercase tracking-wider rounded-sm transition-all",
                      appliedMinPrice === preset.min && appliedMaxPrice === preset.max
                        ? "bg-gold text-white border-gold"
                        : "bg-white text-stone-500 hover:text-charcoal hover:border-stone-400"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FDFBF7] overflow-y-auto animate-in fade-in duration-300">
      {/* ─── Sticky Search Header ─── */}
      <div className="sticky top-0 z-20 animate-in slide-in-from-top-4 duration-300">
        {searchHeader}
      </div>

      {/* ─── Main Content Area ─── */}
      <Container size="wide" className="px-6 py-10 flex-1">
        {/* ── Toolbar: Filter toggle + sort ── */}
        <div className="flex items-center justify-between border-b border-sand/30 pb-6 mb-8 text-[10px] font-bold uppercase tracking-[0.2em]">
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className="hidden lg:flex items-center gap-2 text-charcoal hover:text-gold transition-colors duration-300"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{showSidebar ? "Hide Filters" : "Show Filters"}</span>
          </button>

          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 text-charcoal hover:text-gold transition-colors duration-300"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Filters</span>
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal relative">
            <span>Sorted by:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-charcoal outline-none cursor-pointer font-bold border-none py-0 pr-6 pl-1 focus:ring-0 uppercase appearance-none"
              style={{ backgroundImage: "none" }}
            >
              <option value="relevance_desc">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="createdAt_desc">Newest First</option>
            </select>
            <ChevronDown className="absolute right-0 h-3.5 w-3.5 text-charcoal pointer-events-none" strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Grid Layout: Sidebar + Products ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sidebar (Desktop) */}
          {showSidebar && (
            <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-44 pr-4 border-r border-sand/20">
              {renderFilters(false)}
            </aside>
          )}

          {/* Right Product Grid */}
          <div className={cn("grid-flow-row", showSidebar ? "lg:col-span-9" : "lg:col-span-12")}>
            {/* Skeleton loading */}
            {isLoading && displayedProducts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="space-y-4">
                    <div className="aspect-[3/4] bg-stone-100 animate-pulse rounded-sm" />
                    <div className="h-4 bg-stone-100 animate-pulse w-3/4 rounded" />
                    <div className="h-4 bg-stone-100 animate-pulse w-1/4 rounded" />
                  </div>
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12 pb-16 animate-in fade-in duration-[1500ms]",
                    showSidebar ? "md:grid-cols-3" : "md:grid-cols-4"
                  )}
                >
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8 border-t border-sand/20">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3.5 border border-charcoal bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal hover:bg-charcoal hover:text-cream transition-all duration-500 rounded-sm active:scale-95 shadow-sm"
                    >
                      Load More Matches
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ── No results fallback ── */
              <div className="space-y-16 animate-in fade-in duration-1000 max-w-4xl mx-auto py-12">
                <div className="text-center py-12 border border-dashed border-sand bg-white/40 p-8 rounded-sm">
                  <p className="font-serif italic text-base text-stone-500 mb-2">
                    We could not find any matches for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-6">
                    Try checking spelling or utilizing less specific keywords
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-2 border-b border-charcoal/30 pb-0.5 text-[9px] uppercase tracking-widest font-bold text-charcoal hover:text-gold hover:border-gold transition-all duration-300"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset All Filters</span>
                  </button>
                </div>

                {fallbackProducts.length > 0 && (
                  <div className="space-y-8 border-t border-sand/30 pt-16">
                    <div className="text-center">
                      <h3 className="font-serif text-lg md:text-xl uppercase tracking-[0.25em] text-charcoal">
                        Re-discover Our Icons
                      </h3>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold mt-2">
                        Artisanal silhouettes designed for timeless elegance
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {fallbackProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* ─── Mobile Filters Slide-Out Drawer ─── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[120] flex lg:hidden bg-charcoal/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="ml-auto w-full max-w-xs bg-cream h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-sand/30 pb-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">Faceted Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-stone-400 hover:text-charcoal" />
              </button>
            </div>
            {renderFilters(true)}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
