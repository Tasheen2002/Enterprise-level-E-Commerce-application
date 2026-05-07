"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api";
import { authQueryKeys } from "./queryKeys";
import type { AuthResult } from "../types";
import type { LoginRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResult, ApiCallError, LoginRequest>({
    mutationFn: login,
    onSuccess: () => {
      // Invalidate everything to ensure no stale data remains from previous sessions or guest state
      queryClient.invalidateQueries();
    },
  });
}
