"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@tasheen/ui";

interface HeaderWishlistButtonProps {
  isTransparent: boolean;
}

export function HeaderWishlistButton({ isTransparent }: HeaderWishlistButtonProps) {
  const { wishlistItems } = useWishlist();
  const count = wishlistItems?.length || 0;

  return (
    <Link
      href="/wishlist"
      aria-label="Wishlist"
      prefetch={false}
      className={cn(
        "relative transition-all duration-300 hover:scale-110 hidden sm:block",
        isTransparent
          ? "text-cream hover:text-cream"
          : "text-charcoal hover:text-gold"
      )}
    >
      <Heart className="h-[18px] w-[18px]" strokeWidth={1.2} />
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold tracking-none transition-all duration-300 animate-in zoom-in-50",
            isTransparent
              ? "bg-cream text-charcoal shadow-sm"
              : "bg-gold text-cream"
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
