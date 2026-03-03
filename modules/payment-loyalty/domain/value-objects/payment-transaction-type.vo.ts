import { DomainValidationError } from "../errors";
export enum PaymentTransactionTypeEnum {
  AUTH = "auth",
  CAPTURE = "capture",
  REFUND = "refund",
  VOID = "void",
}

export class PaymentTransactionType {
  private constructor(private readonly value: PaymentTransactionTypeEnum) {}

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
      throw new DomainValidationError(`Invalid payment transaction type: ${value}`);
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
