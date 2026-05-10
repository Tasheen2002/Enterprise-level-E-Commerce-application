"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from "../api";
import type { Address, AddressRequest } from "../types";

const ADDRESSES_KEY = ["addresses"] as const;

type AddressList = { items: Address[]; total: number };

export function useAddresses() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: getAddresses,
  });

  const createMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressRequest> }) =>
      updateAddress(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
    },
  });

  // Optimistic delete: remove the row from the cache immediately so the UI
  // responds at click-speed; rollback on failure.
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_KEY });
      const previous = queryClient.getQueryData<AddressList>(ADDRESSES_KEY);
      if (previous) {
        queryClient.setQueryData<AddressList>(ADDRESSES_KEY, {
          items: previous.items.filter((a) => a.id !== id),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ADDRESSES_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
    },
  });

  // Optimistic set-default: flip `isDefault` locally so the row visibly
  // updates with no perceptible latency.
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_KEY });
      const previous = queryClient.getQueryData<AddressList>(ADDRESSES_KEY);
      if (previous) {
        queryClient.setQueryData<AddressList>(ADDRESSES_KEY, {
          ...previous,
          items: previous.items.map((a) => ({ ...a, isDefault: a.id === id })),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ADDRESSES_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
    },
  });

  return {
    addresses: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    createAddress: createMutation,
    updateAddress: updateMutation,
    deleteAddress: deleteMutation,
    setDefaultAddress: setDefaultMutation,
  };
}
