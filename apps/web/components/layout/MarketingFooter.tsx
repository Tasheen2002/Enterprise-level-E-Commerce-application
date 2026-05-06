import Link from "next/link";
import { Container } from "@tasheen/ui";

const FOOTER_LINKS = [
  { label: "Craftsmanship", href: "/artisanship" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Legal", href: "/legal" },
  { label: "Contact", href: "/contact" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-charcoal/10 bg-cream/95">
      <Container size="wide">
        <div className="flex flex-col gap-4 py-6 text-[11px] uppercase tracking-[0.18em] text-slate-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Tasheen. Handcrafted Heritage.</p>
          <ul className="flex flex-wrap items-center gap-6">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-charcoal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
