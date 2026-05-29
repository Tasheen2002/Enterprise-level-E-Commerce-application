"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Star, X } from "lucide-react";
import { cn } from "@tasheen/ui";
import { Button } from "@tasheen/ui";
import { toast } from "sonner";
import { useProductReviews } from "../hooks/useProductReviews";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  userId: string;
}

export function WriteReviewModal({ isOpen, onClose, productId, userId }: WriteReviewModalProps) {
  const { createReview, isSubmitting } = useProductReviews(productId);
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Please select a rating of at least 1 star.");
      return;
    }
    setErrorMsg(null);

    try {
      await createReview({
        productId,
        userId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });

      toast.success("Review submitted! It will appear once approved by an administrator.", {
        description: "Thank you for sharing your experience.",
        className: "rounded-xl font-sans tracking-wide uppercase text-[10px]",
      });
      
      // Reset form and close
      setRating(0);
      setTitle("");
      setBody("");
      onClose();
    } catch (err: any) {
      console.warn("[WriteReviewModal] submission failed:", err.message);
      const rawMsg = err.message || "";
      if (rawMsg.toUpperCase().includes("REVIEW ALREADY EXISTS")) {
        toast.error("You have already submitted a review for this product.", {
          className: "rounded-xl font-sans tracking-wide uppercase text-[10px]",
        });
        onClose();
      } else {
        toast.error(rawMsg || "Failed to submit review. Please try again.", {
          className: "rounded-xl font-sans tracking-wide uppercase text-[10px]",
        });
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-cream border border-sand/20 rounded-xl shadow-2xl overflow-hidden p-6 lg:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-sand/20 pb-4">
          <div className="space-y-1">
            <h2 className="font-serif text-lg lg:text-xl text-charcoal uppercase tracking-widest font-bold">Write a Review</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Share your genuine experience with the community</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-charcoal transition-colors p-2 text-lg font-light"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="bg-burgundy/10 border border-burgundy/25 text-burgundy text-[10px] p-3 rounded-lg uppercase tracking-wider font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Star Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal">
              Rating <span className="text-burgundy">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const isLit = hoverRating ? starNum <= hoverRating : starNum <= rating;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setRating(starNum)}
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-stone-300 hover:text-gold transition-colors duration-150 transform hover:scale-110 active:scale-95"
                    aria-label={`Rate ${starNum} Stars`}
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 stroke-[1.25] transition-all",
                        isLit ? "fill-gold stroke-gold" : "fill-transparent stroke-stone-300"
                      )} 
                    />
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold ml-2">
                  {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                </span>
              )}
            </div>
          </div>

          {/* Review Headline */}
          <div className="space-y-1.5">
            <label htmlFor="headline" className="text-[10px] font-bold uppercase tracking-widest text-charcoal">
              Headline
            </label>
            <input
              id="headline"
              type="text"
              placeholder="e.g. Absolute perfection in materials & craftsmanship"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="w-full text-[11px] uppercase tracking-wider bg-white/70 border border-sand/20 rounded-lg p-3 text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal transition-colors focus:ring-0"
            />
          </div>

          {/* Review Content */}
          <div className="space-y-1.5">
            <label htmlFor="feedback" className="text-[10px] font-bold uppercase tracking-widest text-charcoal">
              Detailed Feedback
            </label>
            <textarea
              id="feedback"
              placeholder="Share details about the fit, texture, drape, or artisanal quality of this piece..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full text-[11px] bg-white/70 border border-sand/20 rounded-lg p-3 text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal transition-colors focus:ring-0 resize-none leading-relaxed"
            />
            <div className="text-right text-[8px] text-stone-400 uppercase tracking-widest">
              {body.length} / 5000 characters
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-sand/15 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border border-sand/30 hover:border-charcoal text-[9px] font-bold uppercase tracking-widest text-stone-600 hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-full bg-charcoal hover:bg-burgundy disabled:bg-stone-300 text-white text-[9px] font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Submitting
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
