"use client";

import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";

export function ProductGallery({ category }: { category: string }) {
  const { data: products, isLoading } = useProducts(category);

  if (isLoading) {
    return (
      <div className="py-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-20 text-center text-[10px] uppercase tracking-widest text-stone-400">
        Our artisanal collection for this category is currently being curated.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 px-6 pb-24">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
