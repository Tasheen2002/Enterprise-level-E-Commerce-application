"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyPhone, type ApiCallError } from "../api";
import { authQueryKeys } from "./queryKeys";

/**
 * Mutation: send a Firebase phone-auth ID token to the backend, which
 * extracts the verified `phone_number` claim and marks the user's
 * phone as verified. Returns `{ phoneNumber }` on success so callers
 * can render the just-verified number without a follow-up fetch.
 *
 * On success we invalidate the auth identity + user-profile caches so
 * any UI gated on `phoneVerified` / `phone` re-renders against the
 * fresh server state.
 */
export function useVerifyPhone() {
  const queryClient = useQueryClient();
  return useMutation<{ phoneNumber: string }, ApiCallError, string>({
    mutationFn: (idToken: string) => verifyPhone(idToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: authQueryKeys.identity(),
      });
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
