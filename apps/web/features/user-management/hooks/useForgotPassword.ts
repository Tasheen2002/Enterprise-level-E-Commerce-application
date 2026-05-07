"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../api";
import type { ForgotPasswordRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useForgotPassword() {
  return useMutation<void, ApiCallError, ForgotPasswordRequest>({
    mutationFn: forgotPassword,
  });
}
