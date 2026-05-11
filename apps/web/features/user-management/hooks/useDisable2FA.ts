"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { disable2FA, type ApiCallError } from "../api";
import { authQueryKeys } from "./queryKeys";

export function useDisable2FA() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiCallError, string>({
    mutationFn: (password: string) => disable2FA(password),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: authQueryKeys.identity(),
      });
    },
  });
}
