"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "../types";
import { cn } from "@tasheen/ui";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0] || "placeholder.png";
  const hoverImage = product.images[1];
  
  const [showSizePicker, setShowSizePicker] = useState(false);
  const { addToWishlist, isLoading } = useWishlist();

  const hasLongSizes = product.sizes.some(size => size.value.length > 2);
  const gridColsClass = hasLongSizes
    ? (product.sizes.length <= 3 ? "grid-cols-3" : "grid-cols-2")
    : "grid-cols-4";

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizePicker((prev) => !prev);
  };

  const handleOverlaySizeClick = async (e: React.MouseEvent, sizeValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    await addToWishlist(product.id, product.name, sizeValue);
  };

  return (
    <div className="group flex flex-col space-y-4 animate-in fade-in duration-1000">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm">
        <Link href={product.href} className="block h-full w-full relative" style={{ position: "relative" }}>
          {/* Primary Image */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-all duration-[2000ms] ease-editorial group-hover:scale-105",
              hoverImage && "group-hover:opacity-0"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          {/* Hover Image */}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${product.name} alternate view`}
              fill
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-[1500ms] ease-editorial group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
        </Link>

        {/* Wishlist Heart Button */}
        <button 
          onClick={handleWishlistClick}
          className={cn(
            "absolute top-4 right-4 p-2.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all duration-300 group/heart z-20",
            showSizePicker && "bg-burgundy text-white hover:bg-burgundy"
          )}
          aria-label="Add to wishlist"
        >
          <Heart 
            className={cn(
              "h-4 w-4 text-stone-400 group-hover/heart:text-burgundy group-hover/heart:fill-burgundy transition-colors",
              showSizePicker && "text-white group-hover/heart:text-white group-hover/heart:fill-white fill-white"
            )} 
            strokeWidth={1.5} 
          />
        </button>

        {/* Premium Size Selection Popover/Overlay */}
        {showSizePicker && (
          <div className="absolute inset-0 bg-[#FBF9F5]/95 backdrop-blur-[2px] z-30 p-6 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-sm italic text-charcoal tracking-wide">Select Size</h4>
                <p className="text-[9px] uppercase tracking-[0.2em] text-charcoal/40 mt-1 font-bold">To add to your wishlist</p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSizePicker(false);
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 hover:text-charcoal transition-colors"
              >
                ✕ Close
              </button>
            </div>
            
            <div className={cn("grid gap-2 my-auto", gridColsClass)}>
              {product.sizes.map((size) => (
                <button
                  key={size.value}
                  disabled={!size.isAvailable || isLoading}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const success = await addToWishlist(product.id, product.name, size.value);
                    if (success) setShowSizePicker(false);
                  }}
                  className={cn(
                    "py-2.5 border font-bold transition-all uppercase rounded-sm",
                    hasLongSizes 
                      ? "text-[10px] tracking-wider px-1" 
                      : "text-xs tracking-widest",
                    size.isAvailable
                      ? "border-charcoal/10 hover:border-charcoal bg-white text-charcoal active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                      : "border-stone-100 bg-stone-50/50 text-stone-300 cursor-not-allowed line-through"
                  )}
                >
                  {size.value}
                </button>
              ))}
            </div>

            
            <p className="text-[8px] font-bold text-charcoal/30 tracking-[0.25em] text-center uppercase">
              slipperze paris
            </p>
          </div>
        )}

        {/* Bobbies-style Size Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-charcoal/60 backdrop-blur-[2px] py-3 px-2 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-editorial z-10">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {product.sizes.map((size) => (
              <span 
                key={size.value}
                onClick={(e) => size.isAvailable && handleOverlaySizeClick(e, size.value)}
                className={cn(
                  "text-[10px] font-bold tracking-widest transition-colors",
                  size.isAvailable 
                    ? "text-white hover:text-gold cursor-pointer" 
                    : "text-white/30 cursor-not-allowed line-through decoration-white/40"
                )}
              >
                {size.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex justify-between items-start pt-1">
        <div className="space-y-1">
          <h3 className="font-serif text-[13px] tracking-[0.2em] text-charcoal uppercase font-bold">
            <Link href={product.href} className="hover:text-gold transition-colors">
              {product.name}
            </Link>
          </h3>
          <p className="text-[11px] text-stone-400 tracking-wide">
            {product.color}
          </p>
        </div>
        <p className="text-[11px] font-bold text-charcoal tracking-tighter">
          {product.currency} {product.price}
        </p>
      </div>
    </div>
  );
}


