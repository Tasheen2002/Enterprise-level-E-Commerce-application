import { DomainValidationError } from "../errors/engagement.errors";
import { ReviewStatusEnum } from "../enums/engagement.enums";

export class ReviewStatus {
  private constructor(private readonly value: ReviewStatusEnum) {}

  static create(value: string): ReviewStatus {
    return ReviewStatus.fromString(value);
  }

  static fromString(value: string): ReviewStatus {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(ReviewStatusEnum).includes(normalized as ReviewStatusEnum)) {
      throw new DomainValidationError(`Invalid review status: ${value}`);
    }

    return new ReviewStatus(normalized as ReviewStatusEnum);
  }

  static pending(): ReviewStatus {
    return new ReviewStatus(ReviewStatusEnum.PENDING);
  }

  static approved(): ReviewStatus {
    return new ReviewStatus(ReviewStatusEnum.APPROVED);
  }

  static rejected(): ReviewStatus {
    return new ReviewStatus(ReviewStatusEnum.REJECTED);
  }

  static flagged(): ReviewStatus {
    return new ReviewStatus(ReviewStatusEnum.FLAGGED);
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === ReviewStatusEnum.PENDING;
  }

  isApproved(): boolean {
    return this.value === ReviewStatusEnum.APPROVED;
  }

  isRejected(): boolean {
    return this.value === ReviewStatusEnum.REJECTED;
  }

  isFlagged(): boolean {
    return this.value === ReviewStatusEnum.FLAGGED;
  }

  equals(other: ReviewStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
