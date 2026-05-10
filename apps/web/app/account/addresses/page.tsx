import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { AddressBook } from "@/features/user-management/components/AddressBook";
import { PageSpinner } from "@/components/ui/PageSpinner";

export const metadata = buildMetadata({
  title: "Address Book",
  description: "Manage your delivery addresses for artisanal shipments.",
  path: "/account/addresses",
});

export default function AddressPage() {
  return (
    <div className="flex-1 p-8 lg:p-16 bg-stone-50/20">
      <Suspense fallback={<PageSpinner />}>
        <AddressBook />
      </Suspense>
    </div>
  );
}
