import { Suspense } from "react";
import { WishlistList } from "@/features/user-management/components/WishlistList";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { buildMetadata } from "@/lib/seo";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

export const metadata = buildMetadata({
  title: "My Wishlist",
  description: "Your curated selection of artisanal Slipperze sandals.",
  path: "/wishlist",
});

export default function WishlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <MarketingHeader variant="solid" />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Suspense fallback={<PageSpinner />}>
          <WishlistList />
        </Suspense>
      </main>
      <MarketingFooter />
    </div>
  );
}
