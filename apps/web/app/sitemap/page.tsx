import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Sitemap Directory — Legal",
  description: "Navigate all pages, limited collections, and client care resources across the Slipperze boutique directory.",
  path: "/sitemap",
});

interface SitemapGroup {
  heading: string;
  links: { label: string; href: string }[];
}

const SITEMAP_GROUPS: SitemapGroup[] = [
  {
    heading: "The House",
    links: [
      { label: "The Brand", href: "/about" },
      { label: "The Journal", href: "/journal" },
      { label: "Ateliers & Retailers", href: "/retailers" }
    ]
  },
  {
    heading: "Client Care",
    links: [
      { label: "Contact Concierge", href: "/contact" },
      { label: "Delivery & Returns", href: "/delivery-returns" }
    ]
  },
  {
    heading: "Shop Catalog",
    links: [
      { label: "All Collections", href: "/catalog" },
      { label: "New Arrivals", href: "/catalog?sort=newest" },
      { label: "Women's Footwear", href: "/catalog?gender=women" },
      { label: "Men's Footwear", href: "/catalog?gender=men" },
      { label: "Active Wishlist", href: "/wishlist" },
      { label: "Track Your Order", href: "/track" }
    ]
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Sitemap Index", href: "/sitemap" }
    ]
  }
];

export default function SitemapPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">Site Directory</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Sitemap</h1>
            <p className="font-serif text-lg text-stone-850 max-w-xl mx-auto mt-4">
              A complete visual directory of all universes, collections, and care resources on Slipperze.
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pt-8">
            {SITEMAP_GROUPS.map((group) => (
              <div key={group.heading} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl italic text-charcoal">{group.heading}</h2>
                  <div className="h-[1px] w-12 bg-gold/40" />
                </div>
                <ul className="space-y-4 font-sans text-xs sm:text-sm">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-stone-800 hover:text-gold transition-colors duration-300 flex items-center gap-1 group font-medium"
                      >
                        <span className="text-gold/0 group-hover:text-gold transition-all duration-300 font-serif mr-0.5">•</span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}
