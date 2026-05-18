import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogContent } from "@/features/catalog/components/CatalogContent";

export const metadata: Metadata = {
  title: "Artisanal Footwear Catalog | Slipperze",
  description: "Browse our hand-crafted collection of heritage-grade men's and women's footwear designed in Paris.",
};

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-cream flex items-center justify-center animate-pulse"><div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
