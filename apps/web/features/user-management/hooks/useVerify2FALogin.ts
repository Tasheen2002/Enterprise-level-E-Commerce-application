"use client";

import { useMutation } from "@tanstack/react-query";
import { verify2FALogin, type ApiCallError } from "../api";
import type { AuthResult } from "../types";

interface Verify2FAInput {
  pendingToken: string;
  code: string;
}

/**
 * Step 2 of email/password + 2FA login. Persists tokens on success;
 * the page-level handler then redirects to wherever the user was
 * trying to go (the `next` query param on /sign-in).
 */
export function useVerify2FALogin() {
  return useMutation<AuthResult, ApiCallError, Verify2FAInput>({
    mutationFn: ({ pendingToken, code }) => verify2FALogin(pendingToken, code),
  });
}
