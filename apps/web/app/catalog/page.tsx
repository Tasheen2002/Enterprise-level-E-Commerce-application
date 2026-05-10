"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@tasheen/ui";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { imageKitUrl } from "@/lib/imagekit";
import { Suspense } from "react";

const WOMEN_CONTENT = {
  hero: "https://ik.imagekit.io/tasheen/women-hero-hd.mp4",
  subVisit: [
    { label: "Collection", href: "#" },
    { label: "Outlet", href: "#" },
    { label: "New In", href: "#" },
    { label: "About", href: "#" },
    { label: "Stores", href: "#" },
  ],
  categories: [
    { title: "Leather Goods", img: imageKitUrl("cat-leather-goods.png"), href: "/catalog/women/leather-goods" },
    { title: "Heeled Sandals", img: imageKitUrl("cat-heeled-sandals.png"), href: "/catalog/women/heeled-sandals" },
    { title: "Flat Sandals", img: imageKitUrl("cat-flat-sandals.png"), href: "/catalog/women/flat-sandals" },
    { title: "Ballet Flats", img: imageKitUrl("cat-ballet-flats.png"), href: "/catalog/women/ballet-flats" },
  ],
  editorial: {
    title: "The Polka Dot Collection",
    subtitle: "A playful tribute to timeless French elegance. Handcrafted in our Portuguese atelier.",
    img: imageKitUrl("editorial-women.png"),
    link: "/catalog/women/polka-dot",
  }
};

const MEN_CONTENT = {
  hero: imageKitUrl("men-hero.png", { v: "v2" }),
  subVisit: [
    { label: "Collection", href: "#" },
    { label: "Outlet", href: "#" },
    { label: "New In", href: "#" },
    { label: "About", href: "#" },
    { label: "Stores", href: "#" },
  ],
  categories: [
    { title: "Leather Goods", img: imageKitUrl("cat-men-leather-goods.png"), href: "/catalog/men/leather-goods" },
    { title: "Loafers", img: imageKitUrl("cat-men-loafers.png"), href: "/catalog/men/loafers" },
    { title: "Boat Shoes", img: imageKitUrl("cat-men-boat-shoes.png"), href: "/catalog/men/boat-shoes" },
    { title: "Sneakers", img: imageKitUrl("hero-men.png"), href: "/catalog/men/sneakers" },
  ],
  editorial: {
    title: "Artisanal Loafers",
    subtitle: "Classic silhouettes reimagined for the modern gentleman. Perfected through generations of craft.",
    img: imageKitUrl("editorial-men.png"),
    link: "/catalog/men/loafers",
  }
};

function CatalogContent() {
  const searchParams = useSearchParams();
  const gender = searchParams.get("gender") || "women";
  const content = gender === "men" ? MEN_CONTENT : WOMEN_CONTENT;
  const isVideo = content.hero.toLowerCase().endsWith(".mp4");

  return (
    <div className="bg-cream selection:bg-gold selection:text-white">
      {/* ─── Hero Section with Overlay Header ─── */}
      <section className="relative h-screen w-full overflow-hidden">
        <MarketingHeader variant="transparent" />

        {isVideo ? (
          <video
            src={content.hero}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={content.hero}
            alt={`${gender === "men" ? "Men's" : "Women's"} Collection Hero`}
            fill
            priority
            className="object-cover object-[center_88%]"
          />
        )}
        {/* Subtle warm overlay */}
        <div className="absolute inset-0 bg-charcoal/10" />

        {/* Sub-navigation */}
        <div className="absolute bottom-12 left-0 w-full z-20">
          <Container size="wide">
            <nav className="flex items-center justify-center gap-12 lg:gap-20">
              {content.subVisit.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[11px] font-bold uppercase tracking-[0.3em] text-cream drop-shadow-md hover:text-gold transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      </section>

      {/* ─── Category Grid ─── */}
      <section className="py-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {content.categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="relative group aspect-[4/5] overflow-hidden"
            >
              <Image
                src={cat.img}
                alt={cat.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-charcoal/10 group-hover:bg-charcoal/0 transition-colors duration-700" />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl lg:text-3xl text-cream tracking-wide drop-shadow-lg group-hover:scale-110 transition-transform duration-700 select-none">
                  {cat.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Editorial Section ─── */}
      <section className="relative grid grid-cols-1 md:grid-cols-2 bg-ivory">
        <div className="relative aspect-square md:aspect-auto h-full overflow-hidden">
          <Image
            src={content.editorial.img}
            alt="Editorial Moment"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-center justify-center p-12 lg:p-24 text-center space-y-8">
          <h2 className="font-serif text-4xl lg:text-6xl italic text-charcoal leading-tight">
            {content.editorial.title.split(' ').map((word, i) => (
              <span key={i}>
                {word} {i === 1 ? <br /> : ''}
              </span>
            ))}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-muted font-bold max-w-sm leading-relaxed">
            {content.editorial.subtitle}
          </p>
          <Link
            href={content.editorial.link}
            className="inline-block border-b border-charcoal/30 pb-1 text-[10px] uppercase tracking-[0.3em] font-bold text-charcoal hover:border-gold hover:text-gold transition-all duration-300"
          >
            Shop the edit
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-cream animate-pulse" />}>
      <CatalogContent />
    </Suspense>
  );
}
