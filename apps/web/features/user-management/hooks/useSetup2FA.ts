"use client";

import { useMutation } from "@tanstack/react-query";
import { setup2FA, type ApiCallError } from "../api";
import type { Setup2FAResult } from "../types";

/**
 * Begin 2FA enrolment — the backend stages a fresh TOTP secret, the
 * response carries an `otpauth://` URL pre-rendered as a base64 PNG
 * data URL plus the raw base32 secret (for users who can't scan).
 *
 * Calling this when 2FA is already enabled returns a 4xx — disable
 * first.
 */
export function useSetup2FA() {
  return useMutation<Setup2FAResult, ApiCallError, void>({
    mutationFn: () => setup2FA(),
  });
}
