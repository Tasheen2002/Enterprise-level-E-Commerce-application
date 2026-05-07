"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../api";
import { authQueryKeys } from "./queryKeys";
import type { AuthResult } from "../types";
import type { RegisterRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

/**
 * Sign-up mutation. Persists tokens via the API helper, then invalidates
 * the auth identity query so any header / nav element reading
 * `useCurrentIdentity()` re-renders with the new session.
 */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation<AuthResult, ApiCallError, RegisterRequest>({
    mutationFn: register,
    onSuccess: () => {
      // Invalidate everything for a fresh session state
      queryClient.invalidateQueries();
    },
  });
}
