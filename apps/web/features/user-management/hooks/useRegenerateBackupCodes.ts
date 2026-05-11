"use client";

import { useMutation } from "@tanstack/react-query";
import { regenerateBackupCodes, type ApiCallError } from "../api";
import type { BackupCodesResult } from "../types";

export function useRegenerateBackupCodes() {
  return useMutation<BackupCodesResult, ApiCallError, string>({
    mutationFn: (password: string) => regenerateBackupCodes(password),
  });
}
