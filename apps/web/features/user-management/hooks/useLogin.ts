"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api";
import type { AuthResult } from "../types";
import type { LoginRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

/**
 * Login mutation. The actual auth + token persistence happens inside
 * `login()` (writes localStorage + httpOnly cookie via `/api/auth/sync`).
 *
 * On success we drop ALL guest-state caches — the next page (typically
 * `/account`) will hydrate fresh data from the server-side prefetch in
 * `app/account/layout.tsx`, so an explicit client-side prefetch is
 * unnecessary and would race with the SSR data.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResult, ApiCallError, LoginRequest>({
    mutationFn: login,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
