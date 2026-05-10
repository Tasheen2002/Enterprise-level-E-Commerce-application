"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Menu,
  X,
  User,
  Heart,
  ShoppingBag,
  MapPin,
  Phone,
  HelpCircle,
} from "lucide-react";
import { cn } from "@tasheen/ui";
import { BrandWordmark } from "./BrandWordmark";
import { imageKitUrl } from "@/lib/imagekit";

const GENDER_TILES = [
  {
    label: "Women",
    href: "/catalog?gender=women",
    img: imageKitUrl("hero-women.png"),
  },
  {
    label: "Men",
    href: "/catalog?gender=men",
    img: imageKitUrl("hero-men.png"),
  },
] as const;

interface NavSection {
  title: string;
  links: { label: string; href: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Collection",
    links: [
      { label: "All Footwear", href: "/catalog" },
      { label: "Sneakers", href: "/catalog?category=sneakers" },
      { label: "Heeled Sandals", href: "/catalog?category=heeled-sandals" },
      { label: "Flat Sandals", href: "/catalog?category=flat-sandals" },
      { label: "Ballet Flats", href: "/catalog?category=ballet-flats" },
      { label: "Loafers & Derbies", href: "/catalog?category=loafers" },
      { label: "Ankle Boots", href: "/catalog?category=ankle-boots" },
      { label: "Knee High Boots", href: "/catalog?category=knee-high-boots" },
    ],
  },
  {
    title: "Leather Goods",
    links: [
      { label: "Bags", href: "/catalog?category=bags" },
      { label: "Belts", href: "/catalog?category=belts" },
      { label: "Small Leather Goods", href: "/catalog?category=small-leather-goods" },
    ],
  },
  {
    title: "The House",
    links: [
      { label: "Our Heritage", href: "/artisanship" },
      { label: "Bespoke", href: "/bespoke" },
      { label: "Journal", href: "/journal" },
      { label: "Sustainability", href: "/sustainability" },
    ],
  },
];

const DIRECT_LINKS = [
  { label: "Lookbook", href: "/journal" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Stores", href: "/contact" },
] as const;

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account", Icon: User },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart },
  { label: "Bag", href: "/cart", Icon: ShoppingBag },
] as const;

const SUPPORT_LINKS = [
  { label: "Contact Us", href: "/contact", Icon: Phone },
  { label: "Delivery & Returns", href: "/delivery-returns", Icon: MapPin },
  { label: "FAQ / Help", href: "/faq", Icon: HelpCircle },
] as const;

/**
 * Mobile menu drawer — bobbies-inspired.
 *
 * Layout (top → bottom):
 *   1. Header strip (brand + close + cart count)
 *   2. WOMEN / MEN gender hero tiles
 *   3. Account quick row (My Account / Wishlist / Bag with icons)
 *   4. Accordion sections (Collection, Leather Goods, The House) —
 *      each click expands; only one open at a time keeps the drawer
 *      scroll manageable.
 *   5. Direct links (Lookbook / Gift Cards / Stores)
 *   6. Locale + currency line (placeholder until i18n is wired)
 *   7. Support footer (Contact / Delivery / FAQ)
 *
 * The whole drawer mounts only when `mobileOpen` is true so its JSX is
 * paid lazily.
 */
export function MobileMenu({ isTransparent }: { isTransparent: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("Collection");

  const close = () => setMobileOpen(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className={cn(
          "lg:hidden p-1 -ml-1",
          isTransparent ? "text-cream" : "text-charcoal",
        )}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-cream flex flex-col"
          role="dialog"
          aria-label="Site navigation"
        >
          {/* ─── Top strip ─── */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-sand/40 shrink-0">
            <BrandWordmark className="text-base" />
            <button onClick={close} aria-label="Close menu" className="p-1 -mr-1">
              <X className="h-5 w-5 text-charcoal" />
            </button>
          </div>

          {/* Scrollable body — everything below the top strip can scroll. */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* ─── Gender tiles ─── */}
            <div className="grid grid-cols-2 gap-1 p-1">
              {GENDER_TILES.map((tile) => (
                <Link
                  key={tile.href}
                  href={tile.href}
                  onClick={close}
                  className="relative aspect-[3/4] overflow-hidden group"
                >
                  <Image
                    src={tile.img}
                    alt={tile.label}
                    fill
                    sizes="50vw"
                    className="object-cover group-active:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-charcoal/15" />
                  <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-cream tracking-[0.15em] drop-shadow-lg uppercase">
                    {tile.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* ─── Account quick row ─── */}
            <div className="grid grid-cols-3 gap-1 px-1">
              {ACCOUNT_LINKS.map(({ label, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex flex-col items-center justify-center gap-2 py-5 bg-stone-50/50 hover:bg-stone-100 transition-colors"
                >
                  <Icon className="h-5 w-5 text-charcoal/80" strokeWidth={1.4} />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-charcoal/80 font-bold">
                    {label}
                  </span>
                </Link>
              ))}
            </div>

            {/* ─── Accordion sections ─── */}
            <nav className="px-6 mt-6">
              {NAV_SECTIONS.map((section) => {
                const isOpen = openSection === section.title;
                return (
                  <div
                    key={section.title}
                    className="border-b border-sand/30"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection(isOpen ? null : section.title)
                      }
                      className="w-full flex items-center justify-between py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal">
                        {section.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-stone-400 transition-transform duration-300",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <ul className="pb-4 pl-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {section.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={close}
                              className="block py-2.5 text-xs text-charcoal/70 hover:text-charcoal transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {/* Non-collapsing direct links — sit underneath the
                  accordion at the same visual weight. */}
              {DIRECT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="block py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal border-b border-sand/30"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ─── Locale strip (static placeholder until i18n is
                wired). Bobbies uses this slot for country + language;
                we surface the same shape so it's obvious where it
                goes once the data is real. */}
            <div className="px-6 mt-6 space-y-3 text-[10px] uppercase tracking-[0.25em] text-stone-500">
              <p className="flex items-center justify-between">
                <span className="font-bold">Delivery</span>
                <span>United Kingdom · GBP</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-bold">Language</span>
                <span>English</span>
              </p>
            </div>

            {/* ─── Support footer ─── */}
            <div className="px-6 mt-8 pb-10 space-y-1 border-t border-sand/40 pt-6">
              {SUPPORT_LINKS.map(({ label, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-3 py-3 text-xs text-stone-500 hover:text-charcoal transition-colors"
                >
                  <Icon className="h-4 w-4 text-stone-400" strokeWidth={1.4} />
                  {label}
                </Link>
              ))}
              <p className="pt-6 text-[9px] uppercase tracking-[0.3em] text-stone-400/70">
                © {new Date().getFullYear()} Slipperze · Handcrafted Heritage
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
