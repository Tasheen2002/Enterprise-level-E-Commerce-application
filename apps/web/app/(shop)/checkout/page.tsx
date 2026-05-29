import { Suspense } from "react";
import { CheckoutWizard } from "@/features/orders/components/CheckoutWizard";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout | Slipperze",
  description: "Secure Bespoke Footwear Acknowledgment.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Parisian Heritage solid header */}
      <MarketingHeader variant="solid" showSearch={false} />

      {/* Main Checkout Content */}
      <main className="flex-grow p-6 sm:p-10 lg:p-16 min-h-[500px] max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-light text-stone-850 uppercase tracking-[0.2em]">
            Bespoke Checkout
          </h1>
          <p className="text-xs text-stone-600 font-light mt-2 uppercase tracking-widest">
            A secure gateway for handcrafted footwear acquisition.
          </p>
        </div>

        <Suspense fallback={<PageSpinner />}>
          <CheckoutWizard />
        </Suspense>
      </main>

      {/* Parisian Heritage solid footer */}
      <MarketingFooter />
    </div>
  );
}
