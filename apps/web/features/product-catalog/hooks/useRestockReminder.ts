"use client";

import { useMutation } from "@tanstack/react-query";
import { createRestockReminder, CreateReminderPayload } from "../api";

export function useRestockReminder() {
  const subscribeMutation = useMutation({
    mutationFn: (payload: CreateReminderPayload) => createRestockReminder(payload),
  });

  return {
    subscribe: subscribeMutation.mutateAsync,
    isSubmitting: subscribeMutation.isPending,
    error: subscribeMutation.error,
  };
}
