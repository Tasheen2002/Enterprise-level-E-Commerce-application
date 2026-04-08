export class ReviewStatus {
  private constructor(private readonly value: string) {}

  static pending(): ReviewStatus {
    return new ReviewStatus("pending");
  }

  static approved(): ReviewStatus {
    return new ReviewStatus("approved");
  }

  static rejected(): ReviewStatus {
    return new ReviewStatus("rejected");
  }

  static flagged(): ReviewStatus {
    return new ReviewStatus("flagged");
  }

  static fromString(value: string): ReviewStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "pending":
        return ReviewStatus.pending();
      case "approved":
        return ReviewStatus.approved();
      case "rejected":
        return ReviewStatus.rejected();
      case "flagged":
        return ReviewStatus.flagged();
      default:
        throw new Error(`Invalid review status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isApproved(): boolean {
    return this.value === "approved";
  }

  isRejected(): boolean {
    return this.value === "rejected";
  }

  isFlagged(): boolean {
    return this.value === "flagged";
  }

  equals(other: ReviewStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
