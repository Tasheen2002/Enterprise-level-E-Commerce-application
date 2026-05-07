"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "../api";
import type { UpdateProfileRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiCallError, UpdateProfileRequest>({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      // Invalidate both profile and identity queries so the whole app updates
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth-identity"] });
    },
  });
}
