import { ProductReview } from "../entities/product-review.entity.js";
import {
  ReviewId,
  ReviewStatus,
} from "../value-objects/index.js";

export interface ProductReviewQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductReviewFilterOptions {
  productId?: string;
  userId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface IProductReviewRepository {
  // Basic CRUD
  save(review: ProductReview): Promise<void>;
  update(review: ProductReview): Promise<void>;
  delete(reviewId: ReviewId): Promise<void>;

  // Finders
  findById(reviewId: ReviewId): Promise<ProductReview | null>;
  findByProductId(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findByUserId(
    userId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findByStatus(
    status: ReviewStatus,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findAll(options?: ProductReviewQueryOptions): Promise<ProductReview[]>;

  // Advanced queries
  findWithFilters(
    filters: ProductReviewFilterOptions,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findApprovedByProductId(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findPendingReviews(
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]>;
  findByUserIdAndProductId(
    userId: string,
    productId: string
  ): Promise<ProductReview | null>;
  findRecentByProductId(
    productId: string,
    limit?: number
  ): Promise<ProductReview[]>;

  // Counts and statistics
  countByProductId(productId: string): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByStatus(status: ReviewStatus): Promise<number>;
  count(filters?: ProductReviewFilterOptions): Promise<number>;

  // Rating statistics
  getAverageRating(productId: string): Promise<number>;
  getRatingDistribution(productId: string): Promise<Record<number, number>>;

  // Existence checks
  exists(reviewId: ReviewId): Promise<boolean>;
  existsByUserIdAndProductId(
    userId: string,
    productId: string
  ): Promise<boolean>;
}
