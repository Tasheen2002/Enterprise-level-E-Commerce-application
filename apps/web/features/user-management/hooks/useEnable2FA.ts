"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enable2FA, type ApiCallError } from "../api";
import type { BackupCodesResult } from "../types";
import { authQueryKeys } from "./queryKeys";

/**
 * Step 2 of enrolment. Verifies the user can read codes from their
 * authenticator app, flips `twoFactorEnabled = true`, and returns 10
 * single-use backup codes IN PLAINTEXT — these never come back again,
 * the UI must show + offer download/copy before the modal closes.
 *
 * Invalidates the identity cache so the SecuritySettings row flips
 * from "Enable 2FA" to "Disable 2FA" without a manual refetch.
 */
export function useEnable2FA() {
  const queryClient = useQueryClient();
  return useMutation<BackupCodesResult, ApiCallError, string>({
    mutationFn: (code: string) => enable2FA(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: authQueryKeys.identity(),
      });
    },
  });
}
