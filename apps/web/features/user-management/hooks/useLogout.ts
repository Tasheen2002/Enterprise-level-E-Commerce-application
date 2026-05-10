"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api";
import {
  getRefreshToken,
  clearLocalAuthTokens,
  clearAuthCookies,
} from "@/lib/auth";

/**
 * Logout mutation. Optimised for perceived latency:
 *
 * - The backend `/auth/logout` call is fired in the background — its
 *   purpose is server-side session revocation, which the user does not
 *   need to wait on. If it fails, the session expires naturally.
 * - localStorage is cleared synchronously so any in-flight UI no longer
 *   thinks we're authenticated.
 * - We DO await the httpOnly-cookie clear, because the next route
 *   (`/sign-in`) is fine without it but a stale cookie would let the
 *   user navigate back into `/account/*` and bypass the middleware.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      // Fire-and-forget the backend revocation — saves ~100-300 ms vs
      // awaiting the round-trip before redirecting.
      void logout(refreshToken || undefined).catch(() => {});

      // Drop client-side state immediately.
      clearLocalAuthTokens();

      // Await the cookie clear so middleware sees the new state on the
      // very next navigation (e.g. if the user clicks Back).
      await clearAuthCookies();
    },
    onSettled: () => {
      queryClient.clear();
      router.push("/sign-in");
    },
  });
}
