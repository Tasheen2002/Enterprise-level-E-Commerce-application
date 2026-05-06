import { DomainValidationError } from "../errors/engagement.errors";

export enum ReviewStatusValue {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  FLAGGED = "flagged",
}

/** @deprecated Use `ReviewStatusValue`. */
export const ReviewStatusEnum = ReviewStatusValue;
/** @deprecated Use `ReviewStatusValue`. */
export type ReviewStatusEnum = ReviewStatusValue;

// Pattern D (Enum-Like VO).
export class ReviewStatus {
  static readonly PENDING = new ReviewStatus(ReviewStatusValue.PENDING);
  static readonly APPROVED = new ReviewStatus(ReviewStatusValue.APPROVED);
  static readonly REJECTED = new ReviewStatus(ReviewStatusValue.REJECTED);
  static readonly FLAGGED = new ReviewStatus(ReviewStatusValue.FLAGGED);

  private static readonly ALL: ReadonlyArray<ReviewStatus> = [
    ReviewStatus.PENDING,
    ReviewStatus.APPROVED,
    ReviewStatus.REJECTED,
    ReviewStatus.FLAGGED,
  ];

  private constructor(private readonly value: ReviewStatusValue) {
    if (!Object.values(ReviewStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid review status: ${value}. Must be one of: ${Object.values(ReviewStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): ReviewStatus {
    const normalized = value.trim().toLowerCase();
    return (
      ReviewStatus.ALL.find((t) => t.value === normalized) ??
      new ReviewStatus(normalized as ReviewStatusValue)
    );
  }

  static fromString(value: string): ReviewStatus {
    return ReviewStatus.create(value);
  }

  /** @deprecated Use `ReviewStatus.PENDING`. */
  static pending(): ReviewStatus { return ReviewStatus.PENDING; }
  /** @deprecated Use `ReviewStatus.APPROVED`. */
  static approved(): ReviewStatus { return ReviewStatus.APPROVED; }
  /** @deprecated Use `ReviewStatus.REJECTED`. */
  static rejected(): ReviewStatus { return ReviewStatus.REJECTED; }
  /** @deprecated Use `ReviewStatus.FLAGGED`. */
  static flagged(): ReviewStatus { return ReviewStatus.FLAGGED; }

  getValue(): ReviewStatusValue { return this.value; }

  isPending(): boolean { return this.value === ReviewStatusValue.PENDING; }
  isApproved(): boolean { return this.value === ReviewStatusValue.APPROVED; }
  isRejected(): boolean { return this.value === ReviewStatusValue.REJECTED; }
  isFlagged(): boolean { return this.value === ReviewStatusValue.FLAGGED; }

  equals(other: ReviewStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
