/**
 * React Query key factory for the user-management feature. Centralised so
 * cache invalidation across hooks always uses the same keys — drift here
 * means stale data after mutations.
 */
export const authQueryKeys = {
  all: ["auth"] as const,
  identity: () => [...authQueryKeys.all, "identity"] as const,
} as const;
