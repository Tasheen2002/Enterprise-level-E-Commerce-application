import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { BnplStatusEnum } from "../enums";

export class BnplStatus {
  private constructor(private readonly value: BnplStatusEnum) {}

  static create(value: string): BnplStatus {
    return BnplStatus.fromString(value);
  }

  static fromString(value: string): BnplStatus {
    const enumValue = Object.values(BnplStatusEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError("BNPL status", Object.values(BnplStatusEnum).join(" | "));
    }
    return new BnplStatus(enumValue);
  }

  static pending(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.PENDING);
  }

  static approved(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.APPROVED);
  }

  static rejected(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.REJECTED);
  }

  static active(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.ACTIVE);
  }

  static completed(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.COMPLETED);
  }

  static cancelled(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.CANCELLED);
  }

  static failed(): BnplStatus {
    return new BnplStatus(BnplStatusEnum.FAILED);
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
    return this.value === BnplStatusEnum.PENDING;
  }

  isApproved(): boolean {
    return this.value === BnplStatusEnum.APPROVED;
  }

  isRejected(): boolean {
    return this.value === BnplStatusEnum.REJECTED;
  }

  isActive(): boolean {
    return this.value === BnplStatusEnum.ACTIVE;
  }

  isCompleted(): boolean {
    return this.value === BnplStatusEnum.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === BnplStatusEnum.CANCELLED;
  }

  isFailed(): boolean {
    return this.value === BnplStatusEnum.FAILED;
  }
}
