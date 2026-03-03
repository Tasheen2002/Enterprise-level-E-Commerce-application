import { DomainValidationError } from "../errors";
export enum PaymentIntentStatusEnum {
  REQUIRES_ACTION = "requires_action",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export class PaymentIntentStatus {
  private constructor(private readonly value: PaymentIntentStatusEnum) {}

  static requiresAction(): PaymentIntentStatus {
    return new PaymentIntentStatus(PaymentIntentStatusEnum.REQUIRES_ACTION);
  }

  static authorized(): PaymentIntentStatus {
    return new PaymentIntentStatus(PaymentIntentStatusEnum.AUTHORIZED);
  }

  static captured(): PaymentIntentStatus {
    return new PaymentIntentStatus(PaymentIntentStatusEnum.CAPTURED);
  }

  static failed(): PaymentIntentStatus {
    return new PaymentIntentStatus(PaymentIntentStatusEnum.FAILED);
  }

  static cancelled(): PaymentIntentStatus {
    return new PaymentIntentStatus(PaymentIntentStatusEnum.CANCELLED);
  }

  static fromString(value: string): PaymentIntentStatus {
    const enumValue = Object.values(PaymentIntentStatusEnum).find(
      (v) => v === value,
    );
    if (!enumValue) {
      throw new DomainValidationError(`Invalid payment intent status: ${value}`);
    }
    return new PaymentIntentStatus(enumValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentIntentStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isRequiresAction(): boolean {
    return this.value === PaymentIntentStatusEnum.REQUIRES_ACTION;
  }

  isAuthorized(): boolean {
    return this.value === PaymentIntentStatusEnum.AUTHORIZED;
  }

  isCaptured(): boolean {
    return this.value === PaymentIntentStatusEnum.CAPTURED;
  }

  isFailed(): boolean {
    return this.value === PaymentIntentStatusEnum.FAILED;
  }

  isCancelled(): boolean {
    return this.value === PaymentIntentStatusEnum.CANCELLED;
  }
}
