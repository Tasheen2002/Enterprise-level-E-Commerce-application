"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "../types";
import { cn } from "@tasheen/ui";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0] || "placeholder.png";
  const hoverImage = product.images[1];

  return (
    <div className="group flex flex-col space-y-4 animate-in fade-in duration-1000">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-sm">
        <Link href={product.href} className="block h-full w-full">
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

        {/* Wishlist Button */}
        <button 
          className="absolute top-4 right-4 p-2.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all duration-300 group/heart"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4 text-stone-400 group-hover/heart:text-burgundy group-hover/heart:fill-burgundy transition-colors" strokeWidth={1.5} />
        </button>

        {/* Bobbies-style Size Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-charcoal/60 backdrop-blur-[2px] py-3 px-2 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-editorial">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {product.sizes.map((size) => (
              <span 
                key={size.value}
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
