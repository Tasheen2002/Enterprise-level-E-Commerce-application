"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../api";
import { useAuth } from "@/providers/AuthProvider";

export function useUserProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
