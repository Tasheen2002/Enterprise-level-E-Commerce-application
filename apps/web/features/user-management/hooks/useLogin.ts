"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api";
import type { LoginResponse } from "../types";
import type { LoginRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

/**
 * Login mutation. The actual auth + token persistence happens inside
 * `login()` (writes localStorage + httpOnly cookie via `/api/auth/sync`).
 *
 * Resolves to a discriminated `LoginResponse` — either `kind:
 * 'success'` (tokens already persisted, ready to navigate) or
 * `kind: 'two_factor_required'` (2FA on; caller must hand the
 * pendingToken to the challenge page).
 *
 * On success we drop ALL guest-state caches — the next page (typically
 * `/account`) will hydrate fresh data from the server-side prefetch in
 * `app/account/layout.tsx`, so an explicit client-side prefetch is
 * unnecessary and would race with the SSR data. The 2FA-required
 * branch does NOT clear caches (no session yet to swap to).
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<LoginResponse, ApiCallError, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.kind === "success") {
        queryClient.clear();
      }
    },
  });
}
