import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { GiftCardStatusEnum } from "../enums";

export class GiftCardStatus {
  private constructor(private readonly value: GiftCardStatusEnum) {}

  static create(value: string): GiftCardStatus {
    return GiftCardStatus.fromString(value);
  }

  static fromString(value: string): GiftCardStatus {
    const enumValue = Object.values(GiftCardStatusEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError("gift card status", Object.values(GiftCardStatusEnum).join(" | "));
    }
    return new GiftCardStatus(enumValue);
  }

  static active(): GiftCardStatus {
    return new GiftCardStatus(GiftCardStatusEnum.ACTIVE);
  }

  static redeemed(): GiftCardStatus {
    return new GiftCardStatus(GiftCardStatusEnum.REDEEMED);
  }

  static expired(): GiftCardStatus {
    return new GiftCardStatus(GiftCardStatusEnum.EXPIRED);
  }

  static cancelled(): GiftCardStatus {
    return new GiftCardStatus(GiftCardStatusEnum.CANCELLED);
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
    return this.value === GiftCardStatusEnum.ACTIVE;
  }

  isRedeemed(): boolean {
    return this.value === GiftCardStatusEnum.REDEEMED;
  }

  isExpired(): boolean {
    return this.value === GiftCardStatusEnum.EXPIRED;
  }

  isCancelled(): boolean {
    return this.value === GiftCardStatusEnum.CANCELLED;
  }
}
