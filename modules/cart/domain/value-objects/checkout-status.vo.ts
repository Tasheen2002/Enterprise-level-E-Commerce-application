import { CheckoutStatusEnum } from "../enums/cart.enums";
import { DomainValidationError } from "../errors/cart.errors";

export { CheckoutStatusEnum };

export class CheckoutStatus {
  private constructor(private readonly value: CheckoutStatusEnum) {}

  static pending(): CheckoutStatus {
    return new CheckoutStatus(CheckoutStatusEnum.PENDING);
  }

  static completed(): CheckoutStatus {
    return new CheckoutStatus(CheckoutStatusEnum.COMPLETED);
  }

  static expired(): CheckoutStatus {
    return new CheckoutStatus(CheckoutStatusEnum.EXPIRED);
  }

  static cancelled(): CheckoutStatus {
    return new CheckoutStatus(CheckoutStatusEnum.CANCELLED);
  }

  static fromString(value: string): CheckoutStatus {
    const enumValue = Object.values(CheckoutStatusEnum).find((v) => v === value);
    if (!enumValue) {
      throw new DomainValidationError(`Invalid checkout status: ${value}`);
    }
    return new CheckoutStatus(enumValue);
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === CheckoutStatusEnum.PENDING;
  }

  isCompleted(): boolean {
    return this.value === CheckoutStatusEnum.COMPLETED;
  }

  isExpired(): boolean {
    return this.value === CheckoutStatusEnum.EXPIRED;
  }

  isCancelled(): boolean {
    return this.value === CheckoutStatusEnum.CANCELLED;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CheckoutStatus): boolean {
    return this.value === other.value;
  }
}
