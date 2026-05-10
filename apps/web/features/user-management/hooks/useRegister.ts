"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../api";
import type { AuthResult } from "../types";
import type { RegisterRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

/**
 * Sign-up mutation. Token persistence + httpOnly cookie sync happen
 * inside `register()`. On success we clear the guest-state caches so the
 * next page hydrates fresh data from the SSR prefetch.
 */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation<AuthResult, ApiCallError, RegisterRequest>({
    mutationFn: register,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
