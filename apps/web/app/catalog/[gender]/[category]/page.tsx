import { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { CategoryGallery } from "@/features/catalog/components/CategoryGallery";

interface Props {
  params: Promise<{
    gender: string;
    category: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gender, category } = await params;
  const title = `${category.replace(/-/g, " ")} | ${gender.toUpperCase()} | Slipperze`;

  return {
    title,
    description: `Discover our artisanal selection of ${gender}'s ${category.replace(/-/g, " ")}. Hand-crafted heritage goods.`,
  };
}

export default async function CatalogCategoryPage({ params }: Props) {
  const { gender, category } = await params;

  return (
    <main className="min-h-screen bg-cream">
      <MarketingHeader variant="solid" />
      {/* Spacer for sticky header */}
      <div className="pt-12 lg:pt-15" />

      {/* Iconic Title Section */}
      <div className="pt-0 pb-10 text-center">
        <h1 className="font-serif text-xl md:text-2xl uppercase tracking-[0.3em] text-charcoal/90">
          {category.replace(/-/g, " ")}
        </h1>
      </div>

      {/* Main Gallery */}
      <CategoryGallery category={category} />

      {/* Editorial Footer - Storytelling & Navigation */}
      <div className="pb-24 px-6 text-center max-w-4xl mx-auto space-y-8">
        <p className="text-[11px] sm:text-[12px] text-stone-500 max-w-2xl mx-auto leading-relaxed">
          Discover our selection of {gender}&apos;s {category.replace(/-/g, " ")} made in Portugal and Spain.
          Tote bags, shoulder bags, belts, wallets... In leather or suede, make your choice.
        </p>

        {/* Breadcrumbs */}
        <nav className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <Link href="/" className="hover:text-gold transition-colors">Collection</Link>
          <span className="mx-3 text-stone-300">/</span>
          <span className="text-stone-600 font-bold">{category.replace(/-/g, " ")}</span>
        </nav>
      </div>
    </main>
  );
}
