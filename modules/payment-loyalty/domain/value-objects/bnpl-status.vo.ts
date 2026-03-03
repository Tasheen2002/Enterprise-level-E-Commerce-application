import { DomainValidationError } from "../errors";
export class BnplStatus {
  private constructor(private readonly value: string) {}

  static create(value: string): BnplStatus {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("BNPL status cannot be empty");
    }
    return new BnplStatus(value.trim().toLowerCase());
  }

  static pending(): BnplStatus {
    return new BnplStatus("pending");
  }

  static approved(): BnplStatus {
    return new BnplStatus("approved");
  }

  static rejected(): BnplStatus {
    return new BnplStatus("rejected");
  }

  static active(): BnplStatus {
    return new BnplStatus("active");
  }

  static completed(): BnplStatus {
    return new BnplStatus("completed");
  }

  static cancelled(): BnplStatus {
    return new BnplStatus("cancelled");
  }

  static failed(): BnplStatus {
    return new BnplStatus("failed");
  }

  getValue(): string {
    return this.value;
  }

  equals(other: BnplStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
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

  isActive(): boolean {
    return this.value === "active";
  }

  isCompleted(): boolean {
    return this.value === "completed";
  }

  isCancelled(): boolean {
    return this.value === "cancelled";
  }

  isFailed(): boolean {
    return this.value === "failed";
  }
}
