import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../api";
import { customersApi } from "../../customers/api";
import { Review } from "../types";
import { toast } from "sonner";

export function useAdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsData, usersData] = await Promise.all([
        productsApi.getReviews(),
        customersApi.getUsers({ page: 1, limit: 100 }).catch(() => ({ items: [] }))
      ]);

      const map: Record<string, string> = {};
      if (usersData && usersData.items) {
        usersData.items.forEach((u: any) => {
          map[u.id] = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        });
      }

      setUsersMap(map);
      setReviews(reviewsData);
    } catch (err: any) {
      console.error("API error loading reviews:", err);
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateReviewStatus = async (reviewId: string, status: "approved" | "rejected" | "flagged") => {
    try {
      await productsApi.updateReviewStatus(reviewId, status);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
      toast.success(`Review successfully marked as ${status}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update review status");
    }
  };

  return {
    reviews,
    usersMap,
    loading,
    error,
    refetch: fetchReviews,
    updateReviewStatus,
  };
}
