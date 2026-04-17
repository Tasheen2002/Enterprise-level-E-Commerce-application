// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { ReviewId, Rating, ReviewStatus } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class ReviewSubmittedEvent extends DomainEvent {
  constructor(
    public readonly reviewId: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly rating: number
  ) {
    super(reviewId, "Review");
  }

  get eventType(): string {
    return "review.submitted";
  }

  getPayload(): Record<string, unknown> {
    return {
      reviewId: this.reviewId,
      productId: this.productId,
      userId: this.userId,
      rating: this.rating,
    };
  }
}

export class ReviewStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly reviewId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super(reviewId, "Review");
  }

  get eventType(): string {
    return "review.status_changed";
  }

  getPayload(): Record<string, unknown> {
    return {
      reviewId: this.reviewId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface ReviewProps {
  id: ReviewId;
  productId: string;
  userId: string;
  rating: Rating;
  status: ReviewStatus;
  title?: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface ReviewDTO {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  status: string;
  title?: string;
  body?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class ProductReview extends AggregateRoot {
  private constructor(private props: ReviewProps) {
    super();
  }

  static create(
    params: Omit<ReviewProps, "id" | "createdAt" | "updatedAt" | "status">
  ): ProductReview {
    ProductReview.validateProductId(params.productId);
    ProductReview.validateUserId(params.userId);

    const entity = new ProductReview({
      id: ReviewId.create(),
      productId: params.productId,
      userId: params.userId,
      rating: params.rating,
      status: ReviewStatus.pending(),
      title: params.title,
      body: params.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new ReviewSubmittedEvent(
        entity.props.id.getValue(),
        entity.props.productId,
        entity.props.userId,
        entity.props.rating.getValue()
      )
    );

    return entity;
  }

  static fromPersistence(props: ReviewProps): ProductReview {
    return new ProductReview(props);
  }

  private static validateProductId(productId: string): void {
    if (!productId || productId.trim().length === 0) {
      throw new DomainValidationError("Product ID is required");
    }
  }

  private static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new DomainValidationError("User ID is required");
    }
  }

  // Getters
  get id(): ReviewId {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get rating(): Rating {
    return this.props.rating;
  }
  get title(): string | undefined {
    return this.props.title;
  }
  get body(): string | undefined {
    return this.props.body;
  }
  get status(): ReviewStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  private updateStatus(newStatus: ReviewStatus): void {
    const oldStatusLabel = this.props.status.getValue();
    const newStatusLabel = newStatus.getValue();

    if (oldStatusLabel === newStatusLabel) return;

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReviewStatusChangedEvent(
        this.props.id.getValue(),
        oldStatusLabel,
        newStatusLabel
      )
    );
  }

  updateRating(rating: number): void {
    this.props.rating = Rating.fromNumber(rating);
    this.props.updatedAt = new Date();
  }

  updateTitle(title?: string): void {
    this.props.title = title?.trim();
    this.props.updatedAt = new Date();
  }

  updateBody(body?: string): void {
    this.props.body = body?.trim();
    this.props.updatedAt = new Date();
  }

  approve(): void {
    this.updateStatus(ReviewStatus.approved());
  }

  reject(): void {
    this.updateStatus(ReviewStatus.rejected());
  }

  flag(): void {
    this.updateStatus(ReviewStatus.flagged());
  }

  // Helper methods
  isPending(): boolean {
    return this.props.status.isPending();
  }

  isApproved(): boolean {
    return this.props.status.isApproved();
  }

  isRejected(): boolean {
    return this.props.status.isRejected();
  }

  isFlagged(): boolean {
    return this.props.status.isFlagged();
  }

  isPositive(): boolean {
    return this.props.rating.isPositive();
  }

  isNegative(): boolean {
    return this.props.rating.isNegative();
  }

  hasContent(): boolean {
    return !!(this.props.title || this.props.body);
  }

  equals(other: ProductReview): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: ProductReview): ReviewDTO {
    return {
      id: entity.props.id.getValue(),
      productId: entity.props.productId,
      userId: entity.props.userId,
      rating: entity.props.rating.getValue(),
      status: entity.props.status.getValue(),
      title: entity.props.title,
      body: entity.props.body,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateProductReviewData {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
}
