"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api";
import { authQueryKeys } from "./queryKeys";
import { useAuth } from "@/providers/AuthProvider";

export function useCurrentIdentity() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: authQueryKeys.identity(),
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
