import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { PaymentMethodsList } from "@/features/user-management/components/PaymentMethodsList";
import { PageSpinner } from "@/components/ui/PageSpinner";

export const metadata = buildMetadata({
  title: "Payment Methods",
  description: "Manage your payment methods for artisanal purchases.",
  path: "/account/payment-methods",
});

export default function PaymentMethodsPage() {
  return (
    <div className="flex-1 p-8 lg:p-16 bg-stone-50/20">
      <Suspense fallback={<PageSpinner />}>
        <PaymentMethodsList />
      </Suspense>
    </div>
  );
}
