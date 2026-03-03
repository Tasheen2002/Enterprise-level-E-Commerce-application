import { DomainValidationError } from "../errors";
export class GiftCardStatus {
  private constructor(private readonly value: string) {}

  static fromString(value: string): GiftCardStatus {
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
      case "active":
        return GiftCardStatus.active();
      case "redeemed":
        return GiftCardStatus.redeemed();
      case "expired":
        return GiftCardStatus.expired();
      case "cancelled":
        return GiftCardStatus.cancelled();
      default:
        throw new DomainValidationError(`Invalid gift card status: ${value}`);
    }
  }

  static active(): GiftCardStatus {
    return new GiftCardStatus("active");
  }

  static redeemed(): GiftCardStatus {
    return new GiftCardStatus("redeemed");
  }

  static expired(): GiftCardStatus {
    return new GiftCardStatus("expired");
  }

  static cancelled(): GiftCardStatus {
    return new GiftCardStatus("cancelled");
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GiftCardStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isRedeemed(): boolean {
    return this.value === "redeemed";
  }

  isExpired(): boolean {
    return this.value === "expired";
  }

  isCancelled(): boolean {
    return this.value === "cancelled";
  }
}
