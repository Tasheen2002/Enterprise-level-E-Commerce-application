import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { AccountSidebar } from "@/features/user-management/components/AccountSidebar";
import { SecuritySettings } from "@/features/user-management/components/SecuritySettings";

export const metadata = buildMetadata({
  title: "Security & Settings",
  description: "Manage your authentication, credentials, and artisanal preferences.",
  path: "/account/settings",
});

export default function SettingsPage() {
  return (
    <Container size="full" className="flex-1 p-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-10rem)] bg-white">
        <AccountSidebar />
        <main className="flex-1 p-8 lg:p-16">
          <SecuritySettings />
        </main>
      </div>
    </Container>
  );
}
