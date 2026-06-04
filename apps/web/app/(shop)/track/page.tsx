import { Suspense } from "react";
import { OrderTracking } from "@/features/orders/components/OrderTracking";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Track Your Order | Slipperze",
  description: "Locate live creation state and delivery coordinates.",
  path: "/track",
});

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Parisian Heritage solid header */}
      <MarketingHeader variant="solid" showSearch={false} />

      {/* Main Track Content */}
      <main className="flex-grow p-6 sm:p-10 lg:p-16 min-h-[500px] max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-light text-stone-850 uppercase tracking-[0.2em]">
            Creation Tracking
          </h1>
          <p className="text-xs text-stone-400 font-light mt-2 uppercase tracking-widest">
            Examine order coordinates and transit status history.
          </p>
        </div>

        <Suspense fallback={<PageSpinner />}>
          <OrderTracking />
        </Suspense>
      </main>

      {/* Parisian Heritage solid footer */}
      <MarketingFooter />
    </div>
  );
}
