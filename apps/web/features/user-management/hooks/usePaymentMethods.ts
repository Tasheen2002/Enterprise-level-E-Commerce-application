"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "../api";
import type { PaymentMethod, PaymentMethodRequest } from "../types";

const PAYMENT_METHODS_KEY = ["payment-methods"] as const;

type PaymentMethodList = { items: PaymentMethod[]; total: number };

export function usePaymentMethods() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PAYMENT_METHODS_KEY,
    queryFn: getPaymentMethods,
  });

  const createMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PaymentMethodRequest> }) =>
      updatePaymentMethod(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });

  // Optimistic delete — see useAddresses for rationale.
  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: PAYMENT_METHODS_KEY });
      const previous = queryClient.getQueryData<PaymentMethodList>(PAYMENT_METHODS_KEY);
      if (previous) {
        queryClient.setQueryData<PaymentMethodList>(PAYMENT_METHODS_KEY, {
          items: previous.items.filter((p) => p.id !== id),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(PAYMENT_METHODS_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: PAYMENT_METHODS_KEY });
      const previous = queryClient.getQueryData<PaymentMethodList>(PAYMENT_METHODS_KEY);
      if (previous) {
        queryClient.setQueryData<PaymentMethodList>(PAYMENT_METHODS_KEY, {
          ...previous,
          items: previous.items.map((p) => ({ ...p, isDefault: p.id === id })),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(PAYMENT_METHODS_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });

  return {
    paymentMethods: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    createPaymentMethod: createMutation,
    updatePaymentMethod: updateMutation,
    deletePaymentMethod: deleteMutation,
    setDefaultPaymentMethod: setDefaultMutation,
  };
}
