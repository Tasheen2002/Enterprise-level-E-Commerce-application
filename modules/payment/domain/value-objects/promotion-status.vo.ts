import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { PromotionStatusEnum } from "../enums";

export class PromotionStatus {
  private constructor(private readonly value: PromotionStatusEnum) {}

  static create(value: string): PromotionStatus {
    return PromotionStatus.fromString(value);
  }

  static fromString(value: string): PromotionStatus {
    const enumValue = Object.values(PromotionStatusEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError("promotion status", Object.values(PromotionStatusEnum).join(" | "));
    }
    return new PromotionStatus(enumValue);
  }

  static active(): PromotionStatus {
    return new PromotionStatus(PromotionStatusEnum.ACTIVE);
  }

  static inactive(): PromotionStatus {
    return new PromotionStatus(PromotionStatusEnum.INACTIVE);
  }

  static expired(): PromotionStatus {
    return new PromotionStatus(PromotionStatusEnum.EXPIRED);
  }

  static scheduled(): PromotionStatus {
    return new PromotionStatus(PromotionStatusEnum.SCHEDULED);
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

  isActive(): boolean {
    return this.value === PromotionStatusEnum.ACTIVE;
  }

  isInactive(): boolean {
    return this.value === PromotionStatusEnum.INACTIVE;
  }

  isExpired(): boolean {
    return this.value === PromotionStatusEnum.EXPIRED;
  }

  isScheduled(): boolean {
    return this.value === PromotionStatusEnum.SCHEDULED;
  }
}
