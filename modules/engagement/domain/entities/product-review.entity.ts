import {
  ReviewId,
  Rating,
  ReviewStatus,
} from "../value-objects/index.js";

export interface CreateProductReviewData {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface ProductReviewEntityData {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  status: ReviewStatus;
  createdAt: Date;
}

export interface ProductReviewDatabaseRow {
  review_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: Date;
}

export class ProductReview {
  private constructor(
    private readonly reviewId: ReviewId,
    private readonly productId: string,
    private readonly userId: string,
    private rating: Rating,
    private status: ReviewStatus,
    private readonly createdAt: Date,
    private title?: string,
    private body?: string
  ) {}

  // Factory methods
  static create(data: CreateProductReviewData): ProductReview {
    const reviewId = ReviewId.create();
    const rating = Rating.fromNumber(data.rating);

    if (!data.productId) {
      throw new Error("Product ID is required");
    }

    if (!data.userId) {
      throw new Error("User ID is required");
    }

    return new ProductReview(
      reviewId,
      data.productId,
      data.userId,
      rating,
      ReviewStatus.pending(),
      new Date(),
      data.title,
      data.body
    );
  }

  static reconstitute(data: ProductReviewEntityData): ProductReview {
    const reviewId = ReviewId.fromString(data.reviewId);
    const rating = Rating.fromNumber(data.rating);

    return new ProductReview(
      reviewId,
      data.productId,
      data.userId,
      rating,
      data.status,
      data.createdAt,
      data.title,
      data.body
    );
  }

  static fromDatabaseRow(row: ProductReviewDatabaseRow): ProductReview {
    return new ProductReview(
      ReviewId.fromString(row.review_id),
      row.product_id,
      row.user_id,
      Rating.fromNumber(row.rating),
      ReviewStatus.fromString(row.status),
      row.created_at,
      row.title || undefined,
      row.body || undefined
    );
  }

  // Getters
  getReviewId(): ReviewId {
    return this.reviewId;
  }

  getProductId(): string {
    return this.productId;
  }

  getUserId(): string {
    return this.userId;
  }

  getRating(): Rating {
    return this.rating;
  }

  getTitle(): string | undefined {
    return this.title;
  }

  getBody(): string | undefined {
    return this.body;
  }

  getStatus(): ReviewStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business methods
  updateRating(rating: number): void {
    this.rating = Rating.fromNumber(rating);
  }

  updateTitle(title?: string): void {
    this.title = title?.trim();
  }

  updateBody(body?: string): void {
    this.body = body?.trim();
  }

  approve(): void {
    this.status = ReviewStatus.approved();
  }

  reject(): void {
    this.status = ReviewStatus.rejected();
  }

  flag(): void {
    this.status = ReviewStatus.flagged();
  }

  // Helper methods
  isPending(): boolean {
    return this.status.isPending();
  }

  isApproved(): boolean {
    return this.status.isApproved();
  }

  isRejected(): boolean {
    return this.status.isRejected();
  }

  isFlagged(): boolean {
    return this.status.isFlagged();
  }

  isPositive(): boolean {
    return this.rating.isPositive();
  }

  isNegative(): boolean {
    return this.rating.isNegative();
  }

  hasContent(): boolean {
    return !!(this.title || this.body);
  }

  // Convert to data for persistence
  toData(): ProductReviewEntityData {
    return {
      reviewId: this.reviewId.getValue(),
      productId: this.productId,
      userId: this.userId,
      rating: this.rating.getValue(),
      title: this.title,
      body: this.body,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): ProductReviewDatabaseRow {
    return {
      review_id: this.reviewId.getValue(),
      product_id: this.productId,
      user_id: this.userId,
      rating: this.rating.getValue(),
      title: this.title || null,
      body: this.body || null,
      status: this.status.getValue(),
      created_at: this.createdAt,
    };
  }

  equals(other: ProductReview): boolean {
    return this.reviewId.equals(other.reviewId);
  }
}
