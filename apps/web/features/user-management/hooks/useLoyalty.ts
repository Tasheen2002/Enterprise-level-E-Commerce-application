"use client";

import { useQuery } from "@tanstack/react-query";
import { getLoyaltyAccount, getLoyaltyTransactions } from "../api";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentIdentity } from "./useCurrentIdentity";

export function useLoyaltyAccount() {
  const { isAuthenticated } = useAuth();
  const { data: identity } = useCurrentIdentity();
  const userId = identity?.userId;

  return useQuery({
    queryKey: ["loyalty-account", userId],
    queryFn: () => getLoyaltyAccount(userId!),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLoyaltyTransactions(accountId?: string, orderId?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["loyalty-transactions", accountId, orderId],
    queryFn: () => getLoyaltyTransactions(accountId, orderId),
    enabled: isAuthenticated && (!!accountId || !!orderId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
