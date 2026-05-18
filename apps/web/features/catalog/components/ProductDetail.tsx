"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Share2, 
  Ruler,
  Truck,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { Product } from "../types";
import { useProduct } from "../hooks/useProduct";
import { cn } from "@tasheen/ui";
import { Button } from "@tasheen/ui";

export function ProductDetail({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("description");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream space-y-6">
        <p className="font-serif text-xl text-charcoal/60 uppercase tracking-widest">Product not found in our archives.</p>
        <Link href="/catalog/women/heeled-sandals" className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-gold transition-colors">
          Return to Collection
        </Link>
      </div>
    );
  }

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-cream max-w-[1440px] mx-auto">
      {/* Left Column: Editorial Image Grid (2-3 Layout) */}
      <div className="w-full lg:w-[65%] p-4 lg:p-6 space-y-2 lg:space-y-3">
        {/* Row 1: 2 Images */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {product.images.slice(0, 2).map((image, index) => (
            <div key={`row1-${index}`} className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm group">
              <Image
                src={image || "/images/placeholder.png"}
                alt={`${product.name} lifestyle ${index + 1}`}
                fill
                className="object-cover transition-transform duration-[2000ms] ease-editorial group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 32vw"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        
        {/* Row 2: 3 Images */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          {product.images.slice(2, 5).map((image, index) => (
            <div key={`row2-${index}`} className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm group">
              <Image
                src={image || "/images/placeholder.png"}
                alt={`${product.name} detail ${index + 1}`}
                fill
                className="object-cover transition-transform duration-[2000ms] ease-editorial group-hover:scale-105"
                sizes="(max-width: 1024px) 33vw, 21vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Sticky Product Registry (Unified Scroll) */}
      <div className="w-full lg:w-[35%] lg:sticky lg:top-0 self-start p-4 lg:p-6 xl:p-8 space-y-5">
        {/* Header & Breadcrumbs */}
        <div className="space-y-3">
          <nav className="text-[9px] uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
            <Link href="/" className="hover:text-gold transition-colors">Collection</Link>
            <span>/</span>
            <Link href="/catalog/women/heeled-sandals" className="hover:text-gold transition-colors">Heeled Sandals</Link>
          </nav>

          <div className="space-y-1">
            <div className="flex justify-between items-start border-b border-sand/10 pb-4">
              <div className="space-y-0.5">
                <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-widest leading-none uppercase font-bold">
                  {product.name}
                </h1>
                <p className="text-[11px] text-stone-400 font-medium tracking-wide italic">
                  {product.color}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-base font-bold text-charcoal tracking-tight">
                  {product.currency} {product.price}
                </p>
                <button className="text-stone-400 hover:text-burgundy transition-colors">
                  <Heart className="h-5 w-5" strokeWidth={1} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variant Swatches */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-charcoal">Available Finishes</label>
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-sm border border-charcoal p-0.5 cursor-pointer">
              <div className="w-full h-full bg-stone-200 relative overflow-hidden">
                <Image src={product.images[1] || product.images[0] || "/images/placeholder.png"} alt="Mocha" fill className="object-cover" />
              </div>
            </div>
            <div className="w-11 h-11 rounded-sm border border-sand/20 p-0.5 cursor-pointer hover:border-charcoal transition-colors">
              <div className="w-full h-full bg-stone-300 relative overflow-hidden opacity-60">
                <Image src={product.images[0] || "/images/placeholder.png"} alt="Hazelnut" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Size Selection Registry */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-charcoal">Size</label>
              <select className="text-[9px] font-bold uppercase border-none bg-transparent focus:ring-0 p-0 cursor-pointer">
                <option>FR</option>
                <option>EU</option>
                <option>US</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {product.sizes.map((size) => (
              <button
                key={size.value}
                disabled={!size.isAvailable}
                onClick={() => setSelectedSize(size.value)}
                className={cn(
                  "h-11 border text-[11px] font-bold transition-all duration-300",
                  !size.isAvailable 
                    ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[linear-gradient(to_top_right,transparent_49%,#e5e5e5_50%,transparent_51%)]" 
                    : selectedSize === size.value
                      ? "bg-charcoal text-cream border-charcoal"
                      : "bg-white text-charcoal border-sand/30 hover:border-charcoal"
                )}
              >
                {size.value}
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-[9px] text-stone-400 flex items-center gap-2 uppercase tracking-widest font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-300" /> Notify me when back in stock
            </p>
          </div>
        </div>

        {/* Sizing Advice */}
        <div className="bg-ivory/50 p-4 rounded-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Sizing Advice</span>
            <button className="text-[9px] font-bold uppercase flex items-center gap-2 text-charcoal bg-white px-3 py-1 rounded-full border border-sand/20 hover:bg-stone-50 transition-colors">
              <Ruler className="h-3 w-3" /> Find your size
            </button>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
            This model is <strong>true to size</strong>. We recommend you choose your usual size.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          <Button 
            className="w-full h-14 bg-charcoal hover:bg-stone-700 text-cream hover:text-white uppercase tracking-[0.3em] hover:tracking-[0.4em] text-[11px] font-bold rounded-none shadow-lg transition-all duration-500 active:scale-[0.98]"
          >
            Add to Cart
          </Button>

          {/* Trust Markers */}
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal leading-none">Enjoy Free Returns</p>
            <p className="text-[9px] text-stone-400 uppercase tracking-widest leading-none">Taxes and Duties included</p>
          </div>
        </div>

        {/* Product Details Accordion */}
        <div className="border-t border-sand/20 pt-2 space-y-0">
          {[
            { id: "description", label: "Description", content: "Artisanal heeled sandals handcrafted in Italy. Featuring delicate mocha dots on premium leather, a comfortable 75mm heel, and a secure ankle strap." },
            { id: "traceability", label: "Traceability & Recyclability", content: "Designed in Paris, handcrafted in our family-owned workshop in Tuscany, Italy. Leather sourced from certified European tanneries." },
            { id: "shipping", label: "Shipping & Returns", content: "Free shipping on orders over $300. Easy returns within 30 days. Taxes and duties included." }
          ].map((item) => (
            <div key={item.id} className="border-b border-sand/10">
              <button 
                onClick={() => toggleAccordion(item.id)}
                className="w-full py-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-charcoal group"
              >
                <span>{item.label}</span>
                <span className="text-stone-300 group-hover:text-charcoal transition-colors text-lg font-light leading-none">
                  {activeAccordion === item.id ? "−" : "+"}
                </span>
              </button>
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                activeAccordion === item.id ? "max-h-40 pb-6" : "max-h-0"
              )}>
                <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-wider">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
