import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { AccountSidebar } from "@/features/user-management/components/AccountSidebar";
import { AccountDashboard } from "@/features/user-management/components/AccountDashboard";

export const metadata = buildMetadata({
  title: "My Account",
  description: "Manage your Tasheen profile, orders, and artisanal preferences.",
  path: "/account",
});

export default function AccountPage() {
  return (
    <Container size="full" className="flex-1 p-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-10rem)] bg-white">
        <AccountSidebar />
        <AccountDashboard />
      </div>
    </Container>
  );
}
