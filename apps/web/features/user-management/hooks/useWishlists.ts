"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserWishlists, createWishlist, updateWishlist, deleteWishlist } from "../api";
import { useCurrentIdentity } from "./useCurrentIdentity";
import { useAuth } from "@/providers/AuthProvider";
import type { Wishlist } from "../types";

export const WISHLISTS_KEY = ["wishlists"] as const;

export function useWishlists() {
  const { isAuthenticated } = useAuth();
  const { data: identity } = useCurrentIdentity();
  const userId = identity?.userId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...WISHLISTS_KEY, userId],
    queryFn: () => getUserWishlists(userId!),
    enabled: isAuthenticated && !!userId,
  });

  const createMutation = useMutation({
    mutationFn: createWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...WISHLISTS_KEY, userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; description?: string; isPublic?: boolean } }) =>
      updateWishlist(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...WISHLISTS_KEY, userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...WISHLISTS_KEY, userId] });
    },
  });

  return {
    wishlists: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createWishlist: createMutation,
    updateWishlist: updateMutation,
    deleteWishlist: deleteMutation,
  };
}
