"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from "../api";
import { AddressRequest } from "../types";

export function useAddresses() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });

  const createMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressRequest> }) =>
      updateAddress(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
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
