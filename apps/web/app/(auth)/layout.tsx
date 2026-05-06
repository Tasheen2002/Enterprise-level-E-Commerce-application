import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

/**
 * Auth route-group shell. Wraps every `/sign-in`, `/sign-up`, etc. page
 * with the storefront's marketing chrome (header + footer) so customers
 * stay anchored in the brand experience while authenticating.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MarketingHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}
