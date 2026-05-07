import Link from "next/link";
import { cn } from "@tasheen/ui";

export interface BrandWordmarkProps {
  href?: string;
  className?: string;
}

export function BrandWordmark({ href = "/", className }: BrandWordmarkProps) {
  return (
    <Link
      href={href}
      aria-label="Slipperze — home"
      className={cn(
        "inline-block font-serif text-2xl tracking-[0.32em] text-charcoal transition-colors hover:text-gold",
        className,
      )}
    >
      SLIPPERZE
    </Link>
  );
}
