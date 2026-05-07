"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "../api";
import type { DeleteAccountRequest } from "@tasheen/validation/auth";
import type { ApiCallError } from "../api";
import { clearAuthToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, ApiCallError, DeleteAccountRequest>({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Clear tokens
      clearAuthToken();
      
      // Invalidate all queries
      queryClient.clear();
      
      toast.success("Your account has been permanently deleted.");
      router.push("/");
    },
    onError: (error) => {
      const message = error.code === "INVALID_CREDENTIALS" 
        ? "Verification failed. Please check your password and try again."
        : error.message || "Failed to delete account";
      toast.error(message);
    }
  });
}
