import { buildMetadata } from "@/lib/seo";
import { AccountDashboard } from "@/features/user-management/components/AccountDashboard";

export const metadata = buildMetadata({
  title: "My Account",
  description: "Manage your Tasheen profile, orders, and artisanal preferences.",
  path: "/account",
});

export default function AccountPage() {
  return <AccountDashboard />;
}
