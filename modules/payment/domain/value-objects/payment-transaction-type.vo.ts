import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { PaymentTransactionTypeEnum } from "../enums";

export class PaymentTransactionType {
  private constructor(private readonly value: PaymentTransactionTypeEnum) {}

  static create(value: string): PaymentTransactionType {
    return PaymentTransactionType.fromString(value);
  }

  static auth(): PaymentTransactionType {
    return new PaymentTransactionType(PaymentTransactionTypeEnum.AUTH);
  }

  static capture(): PaymentTransactionType {
    return new PaymentTransactionType(PaymentTransactionTypeEnum.CAPTURE);
  }

  static refund(): PaymentTransactionType {
    return new PaymentTransactionType(PaymentTransactionTypeEnum.REFUND);
  }

  static void(): PaymentTransactionType {
    return new PaymentTransactionType(PaymentTransactionTypeEnum.VOID);
  }

  static fromString(value: string): PaymentTransactionType {
    const enumValue = Object.values(PaymentTransactionTypeEnum).find(
      (v) => v === value,
    );
    if (!enumValue) {
      throw new InvalidFormatError("payment transaction type", Object.values(PaymentTransactionTypeEnum).join(" | "));
    }
    return new PaymentTransactionType(enumValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentTransactionType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isAuth(): boolean {
    return this.value === PaymentTransactionTypeEnum.AUTH;
  }

  isCapture(): boolean {
    return this.value === PaymentTransactionTypeEnum.CAPTURE;
  }

  isRefund(): boolean {
    return this.value === PaymentTransactionTypeEnum.REFUND;
  }

  isVoid(): boolean {
    return this.value === PaymentTransactionTypeEnum.VOID;
  }
}
