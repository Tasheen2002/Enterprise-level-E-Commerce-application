import {
  IProductReviewRepository,
  ProductReviewQueryOptions,
  ProductReviewFilterOptions,
} from "../../domain/repositories/product-review.repository.js";
import { ProductReview } from "../../domain/entities/product-review.entity.js";
import {
  ReviewId,
  ReviewStatus,
} from "../../domain/value-objects/index.js";

export class ProductReviewService {
  constructor(
    private readonly reviewRepository: IProductReviewRepository
  ) {}

  async createReview(data: {
    productId: string;
    userId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<ProductReview> {
    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(
      data.userId,
      data.productId
    );

    if (existingReview) {
      throw new Error("User has already reviewed this product");
    }

    const review = ProductReview.create({
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      body: data.body,
    });

    await this.reviewRepository.save(review);
    return review;
  }

  async getReview(reviewId: string): Promise<ProductReview | null> {
    return await this.reviewRepository.findById(ReviewId.fromString(reviewId));
  }

  async updateReviewRating(reviewId: string, rating: number): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.updateRating(rating);
    await this.reviewRepository.update(review);
  }

  async updateReviewTitle(reviewId: string, title?: string): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.updateTitle(title);
    await this.reviewRepository.update(review);
  }

  async updateReviewBody(reviewId: string, body?: string): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.updateBody(body);
    await this.reviewRepository.update(review);
  }

  async approveReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.approve();
    await this.reviewRepository.update(review);
  }

  async rejectReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.reject();
    await this.reviewRepository.update(review);
  }

  async flagReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(
      ReviewId.fromString(reviewId)
    );

    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    review.flag();
    await this.reviewRepository.update(review);
  }

  async deleteReview(reviewId: string): Promise<void> {
    const exists = await this.reviewRepository.exists(
      ReviewId.fromString(reviewId)
    );

    if (!exists) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    await this.reviewRepository.delete(ReviewId.fromString(reviewId));
  }

  async getReviewsByProduct(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findByProductId(productId, options);
  }

  async getReviewsByUser(
    userId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findByUserId(userId, options);
  }

  async getReviewsByStatus(
    status: ReviewStatus,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findByStatus(status, options);
  }

  async getApprovedReviewsByProduct(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findApprovedByProductId(
      productId,
      options
    );
  }

  async getPendingReviews(
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findPendingReviews(options);
  }

  async getRecentReviewsByProduct(
    productId: string,
    limit?: number
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findRecentByProductId(productId, limit);
  }

  async getReviewByUserAndProduct(
    userId: string,
    productId: string
  ): Promise<ProductReview | null> {
    return await this.reviewRepository.findByUserIdAndProductId(
      userId,
      productId
    );
  }

  async getReviewsWithFilters(
    filters: ProductReviewFilterOptions,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findWithFilters(filters, options);
  }

  async getAllReviews(
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    return await this.reviewRepository.findAll(options);
  }

  async countReviews(filters?: ProductReviewFilterOptions): Promise<number> {
    return await this.reviewRepository.count(filters);
  }

  async countReviewsByProduct(productId: string): Promise<number> {
    return await this.reviewRepository.countByProductId(productId);
  }

  async countReviewsByUser(userId: string): Promise<number> {
    return await this.reviewRepository.countByUserId(userId);
  }

  async countReviewsByStatus(status: ReviewStatus): Promise<number> {
    return await this.reviewRepository.countByStatus(status);
  }

  async getAverageRating(productId: string): Promise<number> {
    return await this.reviewRepository.getAverageRating(productId);
  }

  async getRatingDistribution(
    productId: string
  ): Promise<Record<number, number>> {
    return await this.reviewRepository.getRatingDistribution(productId);
  }

  async reviewExists(reviewId: string): Promise<boolean> {
    return await this.reviewRepository.exists(ReviewId.fromString(reviewId));
  }

  async hasUserReviewedProduct(
    userId: string,
    productId: string
  ): Promise<boolean> {
    return await this.reviewRepository.existsByUserIdAndProductId(
      userId,
      productId
    );
  }
}
