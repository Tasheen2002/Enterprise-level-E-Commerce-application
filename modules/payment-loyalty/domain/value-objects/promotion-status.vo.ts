import { DomainValidationError } from "../errors";
export class PromotionStatus {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Promotion status cannot be empty");
    }
  }

  static create(value: string): PromotionStatus {
    return new PromotionStatus(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PromotionStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Common status helpers
  static active(): PromotionStatus {
    return new PromotionStatus("active");
  }

  static inactive(): PromotionStatus {
    return new PromotionStatus("inactive");
  }

  static expired(): PromotionStatus {
    return new PromotionStatus("expired");
  }

  static scheduled(): PromotionStatus {
    return new PromotionStatus("scheduled");
  }

  isActive(): boolean {
    return this.value.toLowerCase() === "active";
  }

  isInactive(): boolean {
    return this.value.toLowerCase() === "inactive";
  }

  isExpired(): boolean {
    return this.value.toLowerCase() === "expired";
  }

  isScheduled(): boolean {
    return this.value.toLowerCase() === "scheduled";
  }
}
