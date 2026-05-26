"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, RefreshCw, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Container } from "@tasheen/ui";
import { ProductCard } from "@/features/product-catalog/components/ProductCard";
import { searchProducts, getSearchFilters, getSearchSuggestions, getProducts, getProductRootCategorySlug, Product, SearchFilter } from "@/features/product-catalog/api";
import { cn } from "@tasheen/ui";

export function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fallback products when search has zero results
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]);

  // Filter & Sorting state
  const [availableFilters, setAvailableFilters] = useState<SearchFilter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<"woman" | "man" | "">("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(undefined);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(undefined);

  const [sortBy, setSortBy] = useState<"relevance" | "price" | "title" | "createdAt">("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI accordion state
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState({
    availability: true,
    gender: true,
    color: true,
    collection: true,
    price: false,
  });

  const toggleAccordion = (key: keyof typeof accordionOpen) => {
    setAccordionOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Sync state with URL query parameters
  useEffect(() => {
    setSearchInput(query);
    setCurrentPage(1);
  }, [query, selectedCategory, selectedBrand, appliedMinPrice, appliedMaxPrice, sortBy, sortOrder]);

  // Autofocus the input on mount and keep the cursor at the end of the text
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Debounce the search input to update the URL parameter in real-time (Bobbies approach)
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== query) {
        if (trimmed) {
          router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
        } else {
          router.replace(`/search`, { scroll: false });
        }
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput, query, router]);

  // Fetch search filters
  useEffect(() => {
    async function loadFilters() {
      try {
        const filters = await getSearchFilters(query, selectedCategory || undefined);
        setAvailableFilters(filters);
      } catch (err) {
        console.warn("Failed to load search filters", err);
      }
    }
    loadFilters();
  }, [query, selectedCategory]);

  // Fetch search results
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    async function loadSearchResults() {
      if (!query) {
        setProducts([]);
        setTotalResults(0);
        setIsLoading(false);
        return;
      }
      try {
        const res = await searchProducts(query, {
          page: currentPage,
          limit: 12,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          minPrice: appliedMinPrice,
          maxPrice: appliedMaxPrice,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        if (active) {
          if (currentPage === 1) {
            setProducts(res.items);
          } else {
            setProducts((prev) => [...prev, ...res.items]);
          }
          setTotalResults(res.total);
          setHasMore(res.hasMore);
          setIsLoading(false);

          // If no products found, load beautiful default icons as curated discovery
          if (res.total === 0) {
            const fallbackRes = await getProducts("heeled-sandals");
            setFallbackProducts(fallbackRes.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load search results", err);
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSearchResults();

    return () => {
      active = false;
    };
  }, [query, currentPage, selectedCategory, selectedBrand, appliedMinPrice, appliedMaxPrice, sortBy, sortOrder]);

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxVal = maxPriceInput ? parseFloat(maxPriceInput) : undefined;
    setAppliedMinPrice(minVal);
    setAppliedMaxPrice(maxVal);
  };

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

  const handleSortChange = (value: string) => {
    if (value === "price_asc") {
      setSortBy("price");
      setSortOrder("asc");
    } else if (value === "price_desc") {
      setSortBy("price");
      setSortOrder("desc");
    } else if (value === "newest") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else {
      setSortBy("relevance");
      setSortOrder("desc");
    }
  };

  // Perform gender and local stock filtering
  const displayedProducts = products.filter((p) => {
    if (!selectedGender) return true;
    const rootSlug = getProductRootCategorySlug(p.categoryIds);
    if (selectedGender === "woman") return rootSlug === "women";
    if (selectedGender === "man") return rootSlug === "men";
    return true;
  });

  return (
    <main className="min-h-screen bg-[#FDFBF7] selection:bg-gold selection:text-white">
      
      {/* Bobbies-style Centered Search Input Bar matching Screenshot 2 */}
      <div className="bg-[#FDFBF7] pt-12 pb-6 border-b border-sand/20">
        <Container size="wide" className="max-w-5xl px-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-charcoal/15 pb-2.5 relative">
            {/* Left Search Icon */}
            <Search className="h-5 w-5 text-stone-400 shrink-0" strokeWidth={1.5} />
            
            {/* Left-aligned Input */}
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent font-serif text-xl sm:text-2xl tracking-wide text-charcoal outline-none border-none px-4 text-left placeholder:text-stone-300"
            />
            
            {/* Right Clear Icon */}
            {searchInput ? (
              <button
                onClick={() => {
                  setSearchInput("");
                  router.push(`/search`);
                }}
                className="p-1 hover:text-gold transition-colors duration-300 shrink-0"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-stone-400 hover:text-charcoal" strokeWidth={1.5} />
              </button>
            ) : (
              <div className="w-5 h-5 shrink-0" /> // Spacer to preserve centering
            )}
          </div>

          {/* Active Query Tag Pill centered immediately below */}
          {query && (
            <div className="flex justify-center mt-5">
              <button
                onClick={() => {
                  setSearchInput("");
                  router.push(`/search`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-charcoal bg-white border border-charcoal/20 rounded-full hover:border-charcoal hover:text-gold transition-all duration-300 shadow-sm"
              >
                <span>{query.toUpperCase()}</span>
                <X className="h-3 w-3 text-stone-400" strokeWidth={2} />
              </button>
            </div>
          )}
        </Container>
      </div>

      <Container size="wide" className="px-6 py-12">
        {!query ? null : (
          <>
            {/* Tool Bar & Quick Controls */}
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

              {/* Elegant Uppercase Sort controls with Lucide ChevronDown overlay */}
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

            {/* Core Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* 1. Left Sidebar: Collapsible Accordion Filters (Desktop) */}
              {showSidebar && (
                <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24 pr-4 border-r border-sand/20">
                  <div className="flex items-center justify-between pb-4 border-b border-sand/30">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">Faceted Filters</span>
                    {(selectedCategory || selectedBrand || selectedGender || inStockOnly || appliedMinPrice !== undefined || appliedMaxPrice !== undefined) && (
                      <button
                        onClick={handleClearAllFilters}
                        className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-burgundy transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Accordion: Availability */}
                  <div className="border-b border-sand/30 pb-4">
                    <button
                      onClick={() => toggleAccordion("availability")}
                      className="w-full flex items-center justify-between text-left py-2 group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
                        Availability
                      </span>
                      {accordionOpen.availability ? (
                        <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      )}
                    </button>
                    {accordionOpen.availability && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                          onClick={() => setInStockOnly(!inStockOnly)}
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

                  {/* Accordion: Gender */}
                  <div className="border-b border-sand/30 pb-4">
                    <button
                      onClick={() => toggleAccordion("gender")}
                      className="w-full flex items-center justify-between text-left py-2 group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
                        Gender
                      </span>
                      {accordionOpen.gender ? (
                        <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      )}
                    </button>
                    {accordionOpen.gender && (
                      <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedGender === "woman"}
                              onChange={() => setSelectedGender(selectedGender === "woman" ? "" : "woman")}
                              className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium">Woman</span>
                          </div>
                          <span className="text-[9px] text-stone-400 font-bold">{totalResults}</span>
                        </label>
                        <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedGender === "man"}
                              onChange={() => setSelectedGender(selectedGender === "man" ? "" : "man")}
                              className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium">Man</span>
                          </div>
                          <span className="text-[9px] text-stone-400 font-bold">0</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Accordion: Color (Mapped to brand filter option) */}
                  {availableFilters.find((f) => f.name === "brand") && (
                    <div className="border-b border-sand/30 pb-4">
                      <button
                        onClick={() => toggleAccordion("color")}
                        className="w-full flex items-center justify-between text-left py-2 group"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
                          Color
                        </span>
                        {accordionOpen.color ? (
                          <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                        )}
                      </button>
                      {accordionOpen.color && (
                        <div className="pt-2 flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {availableFilters
                            .find((f) => f.name === "brand")
                            ?.options?.map((opt) => (
                              <label
                                key={opt.value}
                                className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedBrand === opt.value}
                                    onChange={() => setSelectedBrand(selectedBrand === opt.value ? "" : opt.value)}
                                    className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                                  />
                                  <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium capitalize">
                                    {opt.label}
                                  </span>
                                </div>
                                <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accordion: Collection (Mapped to category filter option) */}
                  {availableFilters.find((f) => f.name === "category") && (
                    <div className="border-b border-sand/30 pb-4">
                      <button
                        onClick={() => toggleAccordion("collection")}
                        className="w-full flex items-center justify-between text-left py-2 group"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
                          Collection
                        </span>
                        {accordionOpen.collection ? (
                          <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                        )}
                      </button>
                      {accordionOpen.collection && (
                        <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                          {availableFilters
                            .find((f) => f.name === "category")
                            ?.options?.map((opt) => (
                              <label
                                key={opt.value}
                                className="flex items-center justify-between text-xs text-charcoal cursor-pointer group/item"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategory === opt.value}
                                    onChange={() => setSelectedCategory(selectedCategory === opt.value ? "" : opt.value)}
                                    className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal focus:ring-gold focus:ring-offset-0 cursor-pointer"
                                  />
                                  <span className="text-charcoal/70 group-hover/item:text-charcoal font-medium capitalize">
                                    {opt.label}
                                  </span>
                                </div>
                                <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accordion: Price Range */}
                  <div className="border-b border-sand/30 pb-4">
                    <button
                      onClick={() => toggleAccordion("price")}
                      className="w-full flex items-center justify-between text-left py-2 group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal group-hover:text-gold transition-colors">
                        Price Range
                      </span>
                      {accordionOpen.price ? (
                        <ChevronUp className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-gold" strokeWidth={1.5} />
                      )}
                    </button>
                    {accordionOpen.price && (
                      <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <form onSubmit={handleApplyPrice} className="space-y-3">
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
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {/* 2. Right Grid Column: Search matches */}
              <div
                className={cn(
                  "grid-flow-row",
                  showSidebar ? "lg:col-span-9" : "lg:col-span-12"
                )}
              >
                {/* Skeletons on initial load */}
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
                  /* No Search Results Fallback (Premium discovery flow) */
                  <div className="space-y-16 animate-in fade-in duration-1000 max-w-4xl mx-auto py-12">
                    <div className="text-center py-12 border border-dashed border-sand bg-white/40 p-8 rounded-sm">
                      <p className="font-serif italic text-base text-stone-500 mb-2">
                        We could not find any matches for &ldquo;{query}&rdquo;
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

                    {/* Iconic Discovery Grid */}
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
        </>
      )}
    </Container>

      {/* 3. Mobile Filters Slide-Out Drawer with accordions */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[120] flex lg:hidden bg-charcoal/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="ml-auto w-full max-w-xs bg-cream h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-sand/30 pb-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">Faceted Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-stone-400 hover:text-charcoal" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Accordion: Availability */}
              <div className="border-b border-sand/30 pb-4">
                <button
                  onClick={() => toggleAccordion("availability")}
                  className="w-full flex items-center justify-between text-left py-2 group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                    Availability
                  </span>
                  {accordionOpen.availability ? (
                    <ChevronUp className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  )}
                </button>
                {accordionOpen.availability && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <button
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className={cn(
                        "px-3 py-1.5 border text-[9px] font-bold uppercase tracking-wider rounded-full transition-all duration-300",
                        inStockOnly
                          ? "bg-charcoal text-white border-charcoal"
                          : "bg-white border-sand text-stone-500 hover:text-charcoal"
                      )}
                    >
                      in stock {inStockOnly && "✕"}
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion: Gender */}
              <div className="border-b border-sand/30 pb-4">
                <button
                  onClick={() => toggleAccordion("gender")}
                  className="w-full flex items-center justify-between text-left py-2 group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                    Gender
                  </span>
                  {accordionOpen.gender ? (
                    <ChevronUp className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  )}
                </button>
                {accordionOpen.gender && (
                  <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGender === "woman"}
                          onChange={() => {
                            setSelectedGender(selectedGender === "woman" ? "" : "woman");
                            setMobileFiltersOpen(false);
                          }}
                          className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal cursor-pointer"
                        />
                        <span className="text-charcoal/70 font-medium">Woman</span>
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold">{totalResults}</span>
                    </label>
                    <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGender === "man"}
                          onChange={() => {
                            setSelectedGender(selectedGender === "man" ? "" : "man");
                            setMobileFiltersOpen(false);
                          }}
                          className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal cursor-pointer"
                        />
                        <span className="text-charcoal/70 font-medium">Man</span>
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold">0</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Accordion: Color */}
              {availableFilters.find((f) => f.name === "brand") && (
                <div className="border-b border-sand/30 pb-4">
                  <button
                    onClick={() => toggleAccordion("color")}
                    className="w-full flex items-center justify-between text-left py-2 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                      Color
                    </span>
                    {accordionOpen.color ? (
                      <ChevronUp className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                    )}
                  </button>
                  {accordionOpen.color && (
                    <div className="pt-2 flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      {availableFilters
                        .find((f) => f.name === "brand")
                        ?.options?.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center justify-between text-xs text-charcoal cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBrand === opt.value}
                                onChange={() => {
                                  setSelectedBrand(selectedBrand === opt.value ? "" : opt.value);
                                  setMobileFiltersOpen(false);
                                }}
                                className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal cursor-pointer"
                              />
                              <span className="text-charcoal/70 font-medium capitalize">
                                {opt.label}
                              </span>
                            </div>
                            <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion: Collection */}
              {availableFilters.find((f) => f.name === "category") && (
                <div className="border-b border-sand/30 pb-4">
                  <button
                    onClick={() => toggleAccordion("collection")}
                    className="w-full flex items-center justify-between text-left py-2 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                      Collection
                    </span>
                    {accordionOpen.collection ? (
                      <ChevronUp className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                    )}
                  </button>
                  {accordionOpen.collection && (
                    <div className="pt-2 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {availableFilters
                        .find((f) => f.name === "category")
                        ?.options?.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center justify-between text-xs text-charcoal cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedCategory === opt.value}
                                onChange={() => {
                                  setSelectedCategory(selectedCategory === opt.value ? "" : opt.value);
                                  setMobileFiltersOpen(false);
                                }}
                                className="h-3.5 w-3.5 rounded-sm border-sand text-charcoal cursor-pointer"
                              />
                              <span className="text-charcoal/70 font-medium capitalize">
                                {opt.label}
                              </span>
                            </div>
                            <span className="text-[9px] text-stone-400 font-bold">{opt.count}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion: Price Range */}
              <div className="border-b border-sand/30 pb-4">
                <button
                  onClick={() => toggleAccordion("price")}
                  className="w-full flex items-center justify-between text-left py-2 group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                    Price Range
                  </span>
                  {accordionOpen.price ? (
                    <ChevronUp className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  )}
                </button>
                {accordionOpen.price && (
                  <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <form
                      onSubmit={(e) => {
                        handleApplyPrice(e);
                        setMobileFiltersOpen(false);
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPriceInput}
                          onChange={(e) => setMinPriceInput(e.target.value)}
                          className="w-full text-xs bg-white border border-sand py-2 px-3 text-charcoal outline-none rounded-sm"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPriceInput}
                          onChange={(e) => setMaxPriceInput(e.target.value)}
                          className="w-full text-xs bg-white border border-sand py-2 px-3 text-charcoal outline-none rounded-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-charcoal text-cream text-[9px] font-bold uppercase tracking-[0.2em] rounded-sm"
                      >
                        Apply Filter
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {(selectedCategory || selectedBrand || selectedGender || inStockOnly || appliedMinPrice !== undefined || appliedMaxPrice !== undefined) && (
                <button
                  onClick={() => {
                    handleClearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-3 border border-stone-200 text-burgundy text-[9px] font-bold uppercase tracking-widest text-center"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
