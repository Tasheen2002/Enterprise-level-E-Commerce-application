"use client";

import React from "react";
import { ReviewModeration } from "@/features/products/components/ReviewModeration";
import { useAdminReviews } from "@/features/products/hooks/useAdminReviews";

export default function ReviewsPage() {
  const { reviews, usersMap, loading, refetch, updateReviewStatus } = useAdminReviews();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span>Product Catalog</span>
            <span>/</span>
            <span className="text-charcoal/80">Reviews Curation</span>
          </div>
          <h1 className="text-3xl font-serif text-charcoal mt-1">Product Reviews Curation</h1>
          <p className="text-[11px] font-bold text-charcoal/70 uppercase tracking-widest mt-1">
            Review and moderate guest submissions, approved ratings, and spam transitions.
          </p>
        </div>
      </div>

      <ReviewModeration
        reviews={reviews}
        usersMap={usersMap}
        isLoading={loading}
        onRefresh={refetch}
        onUpdateStatus={updateReviewStatus}
      />
    </div>
  );
}
