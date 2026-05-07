"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api";
import { getRefreshToken, clearAuthToken } from "@/lib/auth";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const refreshToken = getRefreshToken();
      return logout(refreshToken || undefined);
    },
    onSettled: () => {
      // Clear all user data from cache regardless of success/failure
      queryClient.clear();
      
      // Clear tokens using the helper
      clearAuthToken();
      
      // Redirect to home or sign-in
      router.push("/sign-in");
    },
  });
}
