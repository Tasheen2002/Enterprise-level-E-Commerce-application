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
    <Container size="full" className="flex-1 p-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-10rem)] bg-white">
        <AccountSidebar />
        <AccountMain>
          <Suspense fallback={<AccountSkeleton />}>
            <AccountPrefetchBoundary>{children}</AccountPrefetchBoundary>
          </Suspense>
        </AccountMain>
      </div>
    </Container>
  );
}
