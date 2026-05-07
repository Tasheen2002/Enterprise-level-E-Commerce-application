import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { Container } from "@tasheen/ui";
import { BrandWordmark } from "./BrandWordmark";

const NAV_ITEMS = [
  { label: "Collections", href: "/catalog" },
  { label: "Artisanship", href: "/artisanship" },
  { label: "Bespoke", href: "/bespoke" },
  { label: "Journal", href: "/journal" },
] as const;

const ICON_LINKS = [
  { label: "Search", href: "/search", Icon: Search },
  { label: "Cart", href: "/cart", Icon: ShoppingBag },
  { label: "Account", href: "/account", Icon: User },
] as const;

/**
 * Storefront top navigation. Three-column grid: nav links left, brand
 * wordmark center, utility icons right. The icon column uses the brand
 * gold for the account icon to mirror the editorial cue from the design.
 */
export function MarketingHeader() {
  return (
    <header className="border-b border-charcoal/10 bg-cream/95 backdrop-blur-sm">
      <Container size="wide">
        <div className="grid h-20 grid-cols-3 items-center">
          <nav className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] uppercase tracking-[0.18em] text-charcoal transition-colors hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex justify-center">
            <BrandWordmark />
          </div>

          <div className="flex items-center justify-end gap-6">
            {ICON_LINKS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="text-charcoal transition-colors hover:text-gold last:text-gold"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </header>
  );
}
