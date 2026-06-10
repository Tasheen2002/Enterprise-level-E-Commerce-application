import { Suspense } from "react";
import { LoyaltyDashboard } from "@/features/user-management/components/LoyaltyDashboard";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "My Loyalty & Rewards | Slipperze",
  description: "Examine your loyalty points, tier rewards, and transaction history.",
  path: "/account/loyalty",
});

export default function AccountLoyaltyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <PageSpinner />
        <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Loading Rewards Ledger...</p>
      </div>
    }>
      <LoyaltyDashboard />
    </Suspense>
  );
}
