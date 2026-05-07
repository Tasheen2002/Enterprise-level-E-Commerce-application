"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod, 
  setDefaultPaymentMethod 
} from "../api";
import { PaymentMethodRequest } from "../types";

export function usePaymentMethods() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  });

  const createMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PaymentMethodRequest> }) =>
      updatePaymentMethod(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
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
