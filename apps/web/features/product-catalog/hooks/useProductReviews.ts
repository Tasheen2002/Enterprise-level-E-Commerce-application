"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductReviews, createProductReview } from "../api";
import type { CreateProductReviewPayload } from "../types";

export function useProductReviews(productId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["product-reviews", productId] as const;

  const reviewsQuery = useQuery({
    queryKey,
    queryFn: () => getProductReviews(productId),
    enabled: !!productId,
  });

  const createReviewMutation = useMutation({
    mutationFn: (payload: CreateProductReviewPayload) => createProductReview(payload),
    onSuccess: () => {
      // Invalidate both storefront queries and specific product reviews queries
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      // Errors are handled by the caller (WriteReviewModal) via try/catch on mutateAsync.
      // This handler prevents React Query from surfacing unhandled errors.
    },
  });

  return {
    reviews: reviewsQuery.data?.items ?? [],
    total: reviewsQuery.data?.total ?? 0,
    isLoading: reviewsQuery.isLoading,
    isError: reviewsQuery.isError,
    error: reviewsQuery.error,
    createReview: createReviewMutation.mutateAsync,
    isSubmitting: createReviewMutation.isPending,
    submissionError: createReviewMutation.error,
  };
}
