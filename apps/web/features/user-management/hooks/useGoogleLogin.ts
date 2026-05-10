"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signInWithGoogle } from "@/lib/firebase";
import { loginWithGoogle, ApiCallError } from "../api";
import type { AuthResult } from "../types";

/**
 * Google sign-in mutation. Token persistence + httpOnly cookie sync
 * happen inside `loginWithGoogle()`. On success we clear the guest-state
 * caches so the next page hydrates fresh data from the SSR prefetch.
 */
export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResult, ApiCallError | Error, void>({
    mutationFn: async () => {
      const { idToken } = await signInWithGoogle();
      return loginWithGoogle(idToken);
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
