"use client";

import { useMutation } from "@tanstack/react-query";
import { resendVerification } from "../api";
import type { ResendVerificationRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useResendVerification() {
  return useMutation<void, ApiCallError, ResendVerificationRequest>({
    mutationFn: resendVerification,
  });
}
