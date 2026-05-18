import { Suspense, type ReactNode } from "react";
import { Container } from "@tasheen/ui";
import { AccountSidebar } from "@/features/user-management/components/AccountSidebar";
import { AccountMain } from "./AccountMain";
import { AccountPrefetchBoundary } from "./AccountPrefetchBoundary";
import { AccountSkeleton } from "./AccountSkeleton";

/**
 * Account layout — sync Server Component, so the shell (sidebar +
 * skeleton) paints **immediately** during navigation. The data prefetch
 * happens inside a `<Suspense>` boundary so the user never sees a blank
 * screen while identity + profile load — they see the skeleton fill in.
 *
 * Middleware (`apps/web/middleware.ts`) has already gated the route, so
 * we know we're rendering for an authenticated user by the time we get
 * here.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="flex flex-col lg:flex-row min-h-screen">
        <AccountSidebar />
        <AccountMain>
          <div className="bg-cream min-h-full">
            <Suspense fallback={<AccountSkeleton />}>
              <AccountPrefetchBoundary>{children}</AccountPrefetchBoundary>
            </Suspense>
          </div>
        </AccountMain>
      </div>
    </div>
  );
}
