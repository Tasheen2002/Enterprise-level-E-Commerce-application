import Link from "next/link";
import { Container } from "@tasheen/ui";
import { NewsletterForm } from "./NewsletterForm";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Mail,
  Instagram,
  Linkedin,
  type LucideIcon,
} from "lucide-react";

/* ─── Trust Bar Items ─── */
interface TrustItem {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href?: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    subtitle: "Visa, Mastercard, Amex",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    subtitle: "on orders over £200",
  },
  {
    icon: RotateCcw,
    title: "Free Returns",
    subtitle: "worldwide",
  },
  {
    icon: Mail,
    title: "Contact Us",
    subtitle: "Email, WhatsApp, Phone",
    href: "/contact",
  },
];

/* ─── Footer Columns ─── */
const FOOTER_COLUMNS = [
  {
    heading: "The House",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Heritage", href: "/artisanship" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Journal", href: "/journal" },
      { label: "Retailers", href: "/retailers" },
    ],
  },
  {
    heading: "Client Care",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Delivery & Returns", href: "/delivery-returns" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Care Instructions", href: "/care" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  {
    label: "Pinterest", href: "https://pinterest.com", Icon: () => (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0" />
        <path d="M8.5 21c1.5-2 2.5-4 3-6" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    )
  },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: Linkedin },
] as const;

/**
 * Storefront footer — Server Component. The newsletter input lives in its
 * own client island so keystrokes do not re-render the trust bar, link
 * columns, or social row.
 */
export function MarketingFooter() {
  return (
    <footer>
      {/* ─── Trust Bar ─── */}
      <section className="border-y border-sand/50 bg-cream">
        <Container size="wide">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-sand/40">
            {TRUST_ITEMS.map((item) => {
              const Content = (
                <div className="flex flex-col items-center gap-2 py-6 lg:py-8 text-center group">
                  <item.icon
                    className="h-5 w-5 text-charcoal/40 group-hover:text-gold transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-charcoal">
                    {item.title}
                  </p>
                  <p className="text-[10px] tracking-[0.1em] text-slate-muted">
                    {item.subtitle}
                  </p>
                </div>
              );

              return item.href ? (
                <Link key={item.title} href={item.href} className="hover:bg-ivory/50 transition-colors duration-500">
                  {Content}
                </Link>
              ) : (
                <div key={item.title}>{Content}</div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ─── Main Footer ─── */}
      <section className="bg-cream border-b border-sand/30">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 py-10 lg:py-12">
            {/* Link Columns */}
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="lg:col-span-2 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[12px] text-slate-muted hover:text-charcoal transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Social Column */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal">
                Follow Us
              </h4>
              <div className="flex items-center gap-5">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-slate-muted hover:text-charcoal transition-all duration-300 hover:scale-110"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Column */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal">
                Newsletter
              </h4>
              <p className="text-[12px] text-slate-muted leading-relaxed">
                Subscribe to our newsletter and get{" "}
                <strong className="text-charcoal">10% off</strong> your first order.*
              </p>
              <NewsletterForm />
            </div>
          </div>
        </Container>
      </section>
    </footer>
  );
}
