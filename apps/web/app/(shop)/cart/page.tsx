import { Suspense } from "react";
import { CartView } from "@/features/cart/components/CartView";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your Shopping Bag",
  description: "Curated Bespoke Footwear Archives.",
  path: "/cart",
});

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Parisian Heritage solid header */}
      <MarketingHeader variant="solid" showSearch={false} />

      {/* Main Bag Content */}
      <main className="flex-grow p-6 sm:p-10 lg:p-16 min-h-[500px]">
        <Suspense fallback={<PageSpinner />}>
          <CartView />
        </Suspense>
      </main>

      {/* Parisian Heritage solid footer */}
      <MarketingFooter />
    </div>
  );
}
