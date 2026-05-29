"use client";

import React, { useState } from "react";
import { Star, Check, X, Flag, MessageSquare, RefreshCw, Search } from "lucide-react";
import { cn } from "@tasheen/ui";
import { Review } from "../types";

interface ReviewModerationProps {
  reviews: Review[];
  usersMap?: Record<string, string>;
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (reviewId: string, status: "approved" | "rejected" | "flagged") => Promise<void>;
}

export function ReviewModeration({
  reviews,
  usersMap,
  isLoading,
  onRefresh,
  onUpdateStatus,
}: ReviewModerationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter reviews based on search query and status tabs
  const filteredReviews = reviews.filter((review) => {
    // 1. Text Search
    const searchString = `${review.title || ""} ${review.body || ""} ${review.productId} ${review.userId}`.toLowerCase();
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Status Filter
    if (statusFilter !== "all" && review.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-500/10";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-500/10";
      case "rejected":
        return "bg-stone-50 text-stone-500 border-stone-500/10";
      case "flagged":
      default:
        return "bg-red-50 text-red-700 border-red-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        
        {/* Left Side: Search and Filters */}
        <div className="w-full lg:flex-1 flex flex-col sm:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews by content, Product ID, or User ID..."
              className="w-full bg-[#F9F8F4] border border-charcoal/10 pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-charcoal focus:outline-none focus:border-burgundy rounded-xl transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="inline-flex rounded-xl border border-charcoal/10 bg-[#F9F8F4] p-0.5 shrink-0">
            {["all", "pending", "approved", "rejected", "flagged"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                  statusFilter === status 
                    ? "bg-charcoal text-white rounded-xl" 
                    : "text-charcoal/60 hover:text-charcoal"
                )}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={onRefresh}
            title="Refresh database review queue"
            className="border border-charcoal/10 hover:border-charcoal/20 bg-[#F9F8F4] p-3 text-charcoal hover:bg-charcoal/5 rounded-xl transition-colors flex items-center justify-center"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Reviews Ledger luxury table grid */}
      <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-charcoal/5 bg-[#EBE6D9]/40">
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Reviewer</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Product</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Rating</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Review Details</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Date</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50">Status</th>
                <th className="py-4 px-6 text-[9px] font-bold uppercase tracking-widest text-charcoal/50 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-charcoal/10 border-t-burgundy rounded-full animate-spin" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40">Querying product reviews...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  // Consistent pseudonym names derived from user UUIDs
                  const pseudonyms = [
                    "Elena M.", "Marcus V.", "Sophia L.", "Julian P.", "Charlotte B.",
                    "Adrian K.", "Clara G.", "Raphael S.", "Victoria D.", "Christian T."
                  ];
                  const nameIndex = review.userId.split("-").reduce((acc, part) => acc + parseInt(part, 16) || 0, 0) % pseudonyms.length;
                  
                  const reviewerName = (usersMap && usersMap[review.userId]) || review.reviewerName || pseudonyms[nameIndex] || "Verified Collector";
                  
                  const avatarInitials = reviewerName.split(" ").map(n => n[0]).join("");
 
                  const dateStamp = new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
 
                  return (
                    <tr key={review.id} className="hover:bg-[#F9F8F4]/60 transition-colors group">
                      
                      {/* Reviewer initials avatar badge */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-charcoal/5 border border-charcoal/10 flex items-center justify-center text-charcoal font-serif font-bold text-[10px] tracking-wider shrink-0 shadow-inner">
                            {avatarInitials}
                          </div>
                          <div>
                            <div className="font-serif text-[11px] text-charcoal font-bold">{reviewerName}</div>
                            <div className="text-[8px] font-semibold text-stone-400 uppercase tracking-widest mt-0.5">ID: {review.userId.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Product details */}
                      <td className="py-4 px-6">
                        <div className="text-[11px] text-stone-600 font-bold uppercase tracking-wider">Product Archive</div>
                        <div className="text-[8px] font-mono text-stone-400 mt-0.5">ID: {review.productId.substring(0, 8)}...</div>
                      </td>

                      {/* Star ratings */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "w-3 h-3 stroke-[1.5]",
                                s <= review.rating ? "fill-gold stroke-gold" : "fill-transparent stroke-stone-300"
                              )}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Headline & Body feedback details */}
                      <td className="py-4 px-6 max-w-xs">
                        {review.title && (
                          <div className="font-serif text-[11px] text-charcoal font-bold uppercase tracking-wider mb-1">
                            {review.title}
                          </div>
                        )}
                        {review.body && (
                          <p className="text-[10px] text-stone-500 font-sans leading-normal break-words">
                            {review.body}
                          </p>
                        )}
                      </td>

                      {/* Date stamp */}
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{dateStamp}</span>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-6">
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                          getStatusBadgeStyles(review.status)
                        )}>
                          {review.status}
                        </span>
                      </td>

                      {/* Action items */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {review.status !== "approved" && (
                            <button
                              onClick={() => onUpdateStatus(review.id, "approved")}
                              className="p-1.5 border border-emerald-100 hover:border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 rounded-full transition-all"
                              title="Approve Review"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          )}
                          {review.status !== "rejected" && (
                            <button
                              onClick={() => onUpdateStatus(review.id, "rejected")}
                              className="p-1.5 border border-stone-100 hover:border-stone-200 bg-white hover:bg-stone-50 text-stone-500 rounded-full transition-all"
                              title="Reject Review"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          )}
                          {review.status !== "flagged" && (
                            <button
                              onClick={() => onUpdateStatus(review.id, "flagged")}
                              className="p-1.5 border border-red-100 hover:border-red-200 bg-white hover:bg-red-50 text-red-500 rounded-full transition-all"
                              title="Flag as Spam/Inappropriate"
                            >
                              <Flag className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-charcoal/[0.02] border border-charcoal/5 flex items-center justify-center text-charcoal/30">
                        <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-[12px] font-bold uppercase tracking-widest text-charcoal/60">No Reviews to Moderate</h4>
                      <p className="text-[10px] text-charcoal/40 max-w-[280px] leading-relaxed">
                        The reviews curation queue is currently empty. Re-verify the filter options or wait for guest submissions.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Curation statistics footer */}
        {filteredReviews.length > 0 && (
          <div className="px-6 py-4 border-t border-charcoal/5 bg-[#EBE6D9]/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
            <span>Displaying {filteredReviews.length} client review entries</span>
            <span>Tasheen Staff Console v1.0</span>
          </div>
        )}
      </div>
    </div>
  );
}
