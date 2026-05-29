import { Suspense } from "react";
import { OrderHistory } from "@/features/orders/components/OrderHistory";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "My Orders | Slipperze",
  description: "Examine past handcrafted footwear acquisitions.",
  path: "/account/orders",
});

export default function AccountOrdersPage() {
  return (
    <div className="flex-1 p-5 sm:p-8 lg:px-16 lg:pb-16 lg:pt-24 space-y-10 sm:space-y-12">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-7xl text-charcoal tracking-tight italic">
          My Orders
        </h1>
        <p className="text-[10px] tracking-[0.3em] text-slate-muted/60 uppercase font-bold mt-2">
          Examine past bespoke creation acquisitions and fulfillment records.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <PageSpinner />
          <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Retrieving Order Ledger...</p>
        </div>
      }>
        <OrderHistory />
      </Suspense>
    </div>
  );
}
