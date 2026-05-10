import { buildMetadata } from "@/lib/seo";
import { SecuritySettings } from "@/features/user-management/components/SecuritySettings";

export const metadata = buildMetadata({
  title: "Security & Settings",
  description: "Manage your authentication, credentials, and artisanal preferences.",
  path: "/account/settings",
});

export default function SettingsPage() {
  return (
    <div className="flex-1 p-8 lg:p-16">
      <SecuritySettings />
    </div>
  );
}
