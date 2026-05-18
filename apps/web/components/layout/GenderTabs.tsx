"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@tasheen/ui";

const GENDER_TABS = [
  { label: "Women", href: "/catalog?gender=women", value: "women" },
  { label: "Men", href: "/catalog?gender=men", value: "men" },
] as const;

/**
 * Client island that renders the gender tab nav. Lives in its own
 * component because `useSearchParams()` would otherwise opt the entire
 * marketing layout into dynamic rendering.
 */
export function GenderTabs({ isTransparent }: { isTransparent: boolean }) {
  const searchParams = useSearchParams();
  const currentGender = searchParams.get("gender") || "women";

  return (
    <div className="hidden lg:flex items-center gap-8">
      {GENDER_TABS.map((tab) => {
        const isActive = currentGender === tab.value;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.3em] pb-0.5 transition-all duration-300 border-b",
              isTransparent
                ? cn(
                    "text-cream hover:text-cream",
                    isActive ? "border-cream" : "border-transparent hover:border-cream"
                  )
                : cn(
                    "text-charcoal hover:text-charcoal",
                    isActive ? "border-charcoal" : "border-transparent hover:border-charcoal/30"
                  )
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
