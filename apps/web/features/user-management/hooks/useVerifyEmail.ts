"use client";

import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../api";
import type { VerifyEmailRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useVerifyEmail() {
  return useMutation<void, ApiCallError, VerifyEmailRequest>({
    mutationFn: verifyEmail,
  });
}
