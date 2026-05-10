import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Heart, type LucideIcon } from "lucide-react";
import { Container, cn } from "@tasheen/ui";
import { GenderTabs } from "./GenderTabs";
import { MobileMenu } from "./MobileMenu";

const NAV_ITEMS = [
  { label: "Collection", href: "/catalog" },
  { label: "New In", href: "/catalog?sort=newest" },
  { label: "Artisanship", href: "/artisanship" },
  { label: "Bespoke", href: "/bespoke" },
  { label: "Journal", href: "/journal" },
] as const;

interface IconLink {
  label: string;
  href: string;
  Icon: LucideIcon;
  // The /account & /wishlist icons opt out of prefetch so anonymous visitors
  // don't pay for the account bundle just because the header rendered.
  prefetch?: false;
  // When `true` the icon shows on every breakpoint. When `false` the icon
  // hides below `sm` to keep clear of the centered wordmark on phones.
  // The mobile drawer covers the hidden ones.
  mobileVisible?: boolean;
}

const ICON_LINKS: readonly IconLink[] = [
  { label: "Search", href: "/search", Icon: Search, mobileVisible: false },
  { label: "Account", href: "/account", Icon: User, prefetch: false, mobileVisible: false },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart, prefetch: false, mobileVisible: false },
  { label: "Cart", href: "/cart", Icon: ShoppingBag, mobileVisible: true },
];

/**
 * Storefront header — heritage Parisian style. Server Component.
 *
 * Three-tier layout:
 * 1. Top announcement bar (charcoal with gold text)
 * 2. Main navigation bar (three-column: gender tabs | center nav | utility icons)
 *
 * Interactivity is delegated to two thin client islands:
 * - `<GenderTabs />`  — needs `useSearchParams` for active state
 * - `<MobileMenu />`  — needs `useState` for the drawer
 *
 * The `variant` prop controls whether the header overlays content transparently
 * (for hero pages) or sits on a solid background.
 */
export function MarketingHeader({
  variant = "solid",
}: {
  variant?: "solid" | "transparent";
}) {
  const isTransparent = variant === "transparent";

  return (
    <>
      {/* ─── Announcement Bar ─── */}
      <div className="bg-charcoal text-cream">
        <Container size="wide">
          <div className="flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.2em] uppercase font-medium">
            <span className="hidden sm:inline">Complimentary Shipping on Orders Over £200</span>
            <span className="hidden sm:inline text-gold/60">·</span>
            <span>Free Returns Worldwide</span>
            <span className="text-gold/60">·</span>
            <Link href="/contact" className="text-gold hover:text-cream transition-colors">
              Contact Us
            </Link>
          </div>
        </Container>
      </div>

      {/* ─── Main Header ─── */}
      <header
        className={cn(
          "relative z-50 transition-colors duration-500",
          isTransparent
            ? "absolute inset-x-0 top-[37px] bg-transparent"
            : "bg-cream/95 backdrop-blur-sm border-b border-sand/30"
        )}
      >
        <Container size="wide">
          {/* Top Tier: Brand, Gender, Utility */}
          <div className="flex h-20 items-center justify-between border-b border-sand/10">
            {/* Left: Gender Selection (client island — useSearchParams).
                Wrapped in <Suspense> so the server can statically render the
                surrounding header without bailing out of static rendering. */}
            <Suspense fallback={<div className="hidden lg:flex items-center gap-8" aria-hidden />}>
              <GenderTabs isTransparent={isTransparent} />
            </Suspense>

            {/* Center: Brand Wordmark (Absolute center for stability) */}
            <div className="absolute left-1/2 top-1/2 lg:top-[40px] -translate-x-1/2 -translate-y-1/2">
              <Link href="/" aria-label="Slipperze Home">
                <h1 className={cn(
                  "font-serif text-2xl sm:text-3xl lg:text-5xl tracking-[0.15em] sm:tracking-[0.18em] leading-none transition-colors duration-500",
                  isTransparent ? "text-cream" : "text-charcoal"
                )}>
                  slipperze
                </h1>
              </Link>
            </div>

            {/* Mobile menu (client island — useState) */}
            <MobileMenu isTransparent={isTransparent} />

            {/* Right: Utility Icons. Search/Account/Wishlist hide on
                mobile to keep clear of the centered wordmark — they're
                still reachable via the mobile menu drawer. Cart stays
                visible because checkout-in-progress UX needs it. */}
            <div className="flex items-center gap-4 sm:gap-6">
              {ICON_LINKS.map(({ label, href, Icon, prefetch, mobileVisible }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={prefetch}
                  aria-label={label}
                  className={cn(
                    "transition-all duration-300 hover:scale-110",
                    mobileVisible ? "block" : "hidden sm:block",
                    isTransparent
                      ? "text-cream hover:text-cream"
                      : "text-charcoal hover:text-gold"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.2} />
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Tier: Navigation (Centered) */}
          <nav className="hidden lg:flex h-12 items-center justify-center gap-12">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[10px] uppercase tracking-[0.25em] transition-all duration-300 font-bold",
                  isTransparent
                    ? "text-cream/70 hover:text-cream"
                    : "text-charcoal/60 hover:text-charcoal"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>

        {/* Delicate accent line */}
        {!isTransparent && (
          <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        )}
      </header>
    </>
  );
}
