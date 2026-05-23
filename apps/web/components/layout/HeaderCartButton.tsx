"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@tasheen/ui";

interface HeaderCartButtonProps {
  isTransparent: boolean;
}

export function HeaderCartButton({ isTransparent }: HeaderCartButtonProps) {
  const { cart } = useCart();
  const count = cart?.summary?.itemCount || 0;

  return (
    <Link
      href="/cart"
      aria-label="Shopping Bag"
      className={cn(
        "relative transition-all duration-300 hover:scale-110 block",
        isTransparent
          ? "text-cream hover:text-cream"
          : "text-charcoal hover:text-gold"
      )}
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.2} />
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
