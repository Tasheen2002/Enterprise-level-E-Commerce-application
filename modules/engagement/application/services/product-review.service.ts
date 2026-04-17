import {
  IProductReviewRepository,
  ProductReviewQueryOptions,
  ProductReviewFilters,
} from "../../domain/repositories/product-review.repository";
import {
  ProductReview,
  ReviewDTO,
} from "../../domain/entities/product-review.entity";
import { ReviewId, ReviewStatus, Rating } from "../../domain/value-objects";
import {
  ProductReviewNotFoundError,
  ProductReviewAlreadyExistsError,
} from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedReviewResult {
  items: ReviewDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class ProductReviewService {
  constructor(
    private readonly reviewRepository: IProductReviewRepository,
  ) {}

  async createReview(data: {
    productId: string;
    userId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<ReviewDTO> {
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(
      data.userId,
      data.productId,
    );
    if (existingReview) {
      throw new ProductReviewAlreadyExistsError(data.productId, data.userId);
    }

    const review = ProductReview.create({
      productId: data.productId,
      userId: data.userId,
      rating: Rating.create(data.rating),
      title: data.title,
      body: data.body,
    });

    await this.reviewRepository.save(review);
    return ProductReview.toDTO(review);
  }

  async getReviewById(reviewId: string): Promise<ReviewDTO | null> {
    const entity = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    return entity ? ProductReview.toDTO(entity) : null;
  }

  async updateReviewRating(reviewId: string, rating: number): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.updateRating(rating);
    await this.reviewRepository.save(review);
  }

  async updateReviewTitle(reviewId: string, title?: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.updateTitle(title);
    await this.reviewRepository.save(review);
  }

  async updateReviewBody(reviewId: string, body?: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.updateBody(body);
    await this.reviewRepository.save(review);
  }

  async approveReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.approve();
    await this.reviewRepository.save(review);
  }

  async rejectReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.reject();
    await this.reviewRepository.save(review);
  }

  async flagReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    review.flag();
    await this.reviewRepository.save(review);
  }

  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(ReviewId.fromString(reviewId));
    if (!review) throw new ProductReviewNotFoundError(reviewId);
    await this.reviewRepository.delete(review.id);
  }

  async getReviewsByProduct(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findByProductId(productId, options);
    return this.mapPaginated(result);
  }

  async getReviewsByUser(
    userId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findByUserId(userId, options);
    return this.mapPaginated(result);
  }

  async getReviewsByStatus(
    status: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findByStatus(
      ReviewStatus.fromString(status),
      options,
    );
    return this.mapPaginated(result);
  }

  async getApprovedReviewsByProduct(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findApprovedByProductId(productId, options);
    return this.mapPaginated(result);
  }

  async getPendingReviews(
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findPendingReviews(options);
    return this.mapPaginated(result);
  }

  async getRecentReviewsByProduct(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findRecentByProductId(productId, options);
    return this.mapPaginated(result);
  }

  async getReviewByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ReviewDTO | null> {
    const entity = await this.reviewRepository.findByUserIdAndProductId(userId, productId);
    return entity ? ProductReview.toDTO(entity) : null;
  }

  async getReviewsWithFilters(
    filters: ProductReviewFilters,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findWithFilters(filters, options);
    return this.mapPaginated(result);
  }

  async getAllReviews(options?: ProductReviewQueryOptions): Promise<PaginatedReviewResult> {
    const result = await this.reviewRepository.findAll(options);
    return this.mapPaginated(result);
  }

  async countReviews(filters?: ProductReviewFilters): Promise<number> {
    return this.reviewRepository.count(filters);
  }

  async countReviewsByProduct(productId: string): Promise<number> {
    return this.reviewRepository.countByProductId(productId);
  }

  async countReviewsByUser(userId: string): Promise<number> {
    return this.reviewRepository.countByUserId(userId);
  }

  async countReviewsByStatus(status: string): Promise<number> {
    return this.reviewRepository.countByStatus(ReviewStatus.fromString(status));
  }

  async getAverageRating(productId: string): Promise<number> {
    return this.reviewRepository.getAverageRating(productId);
  }

  async getRatingDistribution(productId: string): Promise<Record<number, number>> {
    return this.reviewRepository.getRatingDistribution(productId);
  }

  async reviewExists(reviewId: string): Promise<boolean> {
    return this.reviewRepository.exists(ReviewId.fromString(reviewId));
  }

  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    return this.reviewRepository.existsByUserIdAndProductId(userId, productId);
  }

  private mapPaginated(result: PaginatedResult<ProductReview>): PaginatedReviewResult {
    return {
      items: result.items.map(ProductReview.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
