import { Metadata } from "next";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";
import { getProductBySlug } from "@/features/catalog/api";

interface Props {
  params: Promise<{
    gender: string;
    category: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gender, category, slug } = await params;
  const product = await getProductBySlug(slug);
  const title = product ? `${product.name} | ${category.replace(/-/g, " ")} | Slipperze` : 'Product | Slipperze';

  return {
    title,
    description: product ? `Discover the artisanal ${product.name} in ${product.color}. Hand-crafted luxury sandals.` : 'Discover our artisanal collection.',
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-cream">
      <MarketingHeader variant="solid" />
      <ProductDetail slug={slug} />
    </main>
  );
}
