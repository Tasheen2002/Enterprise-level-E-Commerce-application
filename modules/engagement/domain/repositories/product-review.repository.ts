import { ProductReview } from "../entities/product-review.entity";
import { ReviewId } from "../value-objects";
import { ReviewStatusValue } from "../value-objects/review-status.vo";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface ProductReviewFilters {
  productId?: string;
  userId?: string;
  status?: ReviewStatusValue;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface IProductReviewRepository {
  // Basic CRUD
  save(review: ProductReview): Promise<void>;
  delete(reviewId: ReviewId): Promise<void>;

  // Finders
  findById(reviewId: ReviewId): Promise<ProductReview | null>;
  findByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findByUserId(
    userId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findByStatus(
    status: ReviewStatusValue,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findAll(
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;

  // Advanced queries
  findWithFilters(
    filters: ProductReviewFilters,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findApprovedByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findPendingReviews(
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;
  findByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<ProductReview | null>;
  findRecentByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>>;

  // Counts and statistics
  countByProductId(productId: string): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByStatus(status: ReviewStatusValue): Promise<number>; 
  count(filters?: ProductReviewFilters): Promise<number>;

  // Rating statistics
  getAverageRating(productId: string): Promise<number>;
  getRatingDistribution(productId: string): Promise<Record<number, number>>;

  // Existence checks
  exists(reviewId: ReviewId): Promise<boolean>;
  existsByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface ProductReviewQueryOptions extends PaginationOptions {
  sortBy?: "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}
