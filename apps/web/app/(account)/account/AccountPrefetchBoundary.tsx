import type { ReactNode } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getCurrentUserServer, getUserProfileServer } from "@/lib/api-server";
import { authQueryKeys } from "@/features/user-management/hooks/queryKeys";

/**
 * Async boundary that prefetches identity + profile in parallel, dehydrates
 * the React Query cache, and hands the warm cache to its children.
 *
 * Lives in its own component (rather than directly in the layout) so the
 * layout itself can stay sync — meaning the sidebar + a streaming
 * `<AccountSkeleton />` paint immediately during navigation while this
 * component awaits the server-side fetches in parallel.
 */
export async function AccountPrefetchBoundary({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: authQueryKeys.identity(),
      queryFn: getCurrentUserServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-profile"],
      queryFn: getUserProfileServer,
    }),
  ]);

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
