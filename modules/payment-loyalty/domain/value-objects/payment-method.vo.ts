import { DomainValidationError } from "../errors";
export class PaymentMethod {
  private constructor(private readonly value: string) {}

  static card(): PaymentMethod {
    return new PaymentMethod("card");
  }

  static stripe(): PaymentMethod {
    return new PaymentMethod("stripe");
  }

  static bankTransfer(): PaymentMethod {
    return new PaymentMethod("bank_transfer");
  }

  static giftCard(): PaymentMethod {
    return new PaymentMethod("gift_card");
  }

  static bnpl(): PaymentMethod {
    return new PaymentMethod("bnpl");
  }

  static loyaltyPoints(): PaymentMethod {
    return new PaymentMethod("loyalty_points");
  }

  static fromString(value: string): PaymentMethod {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "card":
        return PaymentMethod.card();
      case "stripe":
        return PaymentMethod.stripe();
      case "bank_transfer":
        return PaymentMethod.bankTransfer();
      case "gift_card":
        return PaymentMethod.giftCard();
      case "bnpl":
        return PaymentMethod.bnpl();
      case "loyalty_points":
        return PaymentMethod.loyaltyPoints();
      default:
        throw new DomainValidationError(`Invalid payment method: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isCard(): boolean {
    return this.value === "card";
  }

  isStripe(): boolean {
    return this.value === "stripe";
  }

  isBankTransfer(): boolean {
    return this.value === "bank_transfer";
  }

  isGiftCard(): boolean {
    return this.value === "gift_card";
  }

  isBnpl(): boolean {
    return this.value === "bnpl";
  }

  isLoyaltyPoints(): boolean {
    return this.value === "loyalty_points";
  }

  equals(other: PaymentMethod): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
