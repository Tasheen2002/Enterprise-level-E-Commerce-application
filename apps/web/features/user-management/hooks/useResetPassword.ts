"use client";

import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../api";
import type { ResetPasswordRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useResetPassword() {
  return useMutation<void, ApiCallError, ResetPasswordRequest>({
    mutationFn: resetPassword,
  });
}
