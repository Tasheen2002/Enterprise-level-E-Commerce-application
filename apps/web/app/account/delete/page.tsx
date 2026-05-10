import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { DeleteAccountForm } from "@/features/user-management/components/DeleteAccountForm";
import { PageSpinner } from "@/components/ui/PageSpinner";

export const metadata = buildMetadata({
  title: "Account Deletion",
  description: "Permanently close your Tasheen member registry.",
  path: "/account/delete",
});

export default function DeleteAccountPage() {
  return (
    <div className="flex-1 p-8 lg:p-16 bg-stone-50/20">
      <Suspense fallback={<PageSpinner />}>
        <DeleteAccountForm />
      </Suspense>
    </div>
  );
}
