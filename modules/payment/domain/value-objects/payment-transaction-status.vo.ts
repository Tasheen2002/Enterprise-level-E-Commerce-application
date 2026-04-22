import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { PaymentTransactionStatusEnum } from "../enums";

export class PaymentTransactionStatus {
  private constructor(private readonly value: PaymentTransactionStatusEnum) {}

  static create(value: string): PaymentTransactionStatus {
    return PaymentTransactionStatus.fromString(value);
  }

  static fromString(value: string): PaymentTransactionStatus {
    const enumValue = Object.values(PaymentTransactionStatusEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError(
        "payment transaction status",
        Object.values(PaymentTransactionStatusEnum).join(" | "),
      );
    }
    return new PaymentTransactionStatus(enumValue);
  }

  static pending(): PaymentTransactionStatus {
    return new PaymentTransactionStatus(PaymentTransactionStatusEnum.PENDING);
  }

  static succeeded(): PaymentTransactionStatus {
    return new PaymentTransactionStatus(PaymentTransactionStatusEnum.SUCCEEDED);
  }

  static failed(): PaymentTransactionStatus {
    return new PaymentTransactionStatus(PaymentTransactionStatusEnum.FAILED);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentTransactionStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === PaymentTransactionStatusEnum.PENDING;
  }

  isSucceeded(): boolean {
    return this.value === PaymentTransactionStatusEnum.SUCCEEDED;
  }

  isFailed(): boolean {
    return this.value === PaymentTransactionStatusEnum.FAILED;
  }
}
