import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum GiftCardStatusValue {
  ACTIVE = "active",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

/** @deprecated Use `GiftCardStatusValue`. */
export const GiftCardStatusEnum = GiftCardStatusValue;
/** @deprecated Use `GiftCardStatusValue`. */
export type GiftCardStatusEnum = GiftCardStatusValue;

// Pattern D (Enum-Like VO).
export class GiftCardStatus {
  static readonly ACTIVE = new GiftCardStatus(GiftCardStatusValue.ACTIVE);
  static readonly REDEEMED = new GiftCardStatus(GiftCardStatusValue.REDEEMED);
  static readonly EXPIRED = new GiftCardStatus(GiftCardStatusValue.EXPIRED);
  static readonly CANCELLED = new GiftCardStatus(GiftCardStatusValue.CANCELLED);

  private static readonly ALL: ReadonlyArray<GiftCardStatus> = [
    GiftCardStatus.ACTIVE,
    GiftCardStatus.REDEEMED,
    GiftCardStatus.EXPIRED,
    GiftCardStatus.CANCELLED,
  ];

  private constructor(private readonly value: GiftCardStatusValue) {
    if (!Object.values(GiftCardStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid gift card status: ${value}. Must be one of: ${Object.values(GiftCardStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): GiftCardStatus {
    const normalized = value.trim().toLowerCase();
    return (
      GiftCardStatus.ALL.find((t) => t.value === normalized) ??
      new GiftCardStatus(normalized as GiftCardStatusValue)
    );
  }

  static fromString(value: string): GiftCardStatus {
    return GiftCardStatus.create(value);
  }

  /** @deprecated Use `GiftCardStatus.ACTIVE`. */
  static active(): GiftCardStatus { return GiftCardStatus.ACTIVE; }
  /** @deprecated Use `GiftCardStatus.REDEEMED`. */
  static redeemed(): GiftCardStatus { return GiftCardStatus.REDEEMED; }
  /** @deprecated Use `GiftCardStatus.EXPIRED`. */
  static expired(): GiftCardStatus { return GiftCardStatus.EXPIRED; }
  /** @deprecated Use `GiftCardStatus.CANCELLED`. */
  static cancelled(): GiftCardStatus { return GiftCardStatus.CANCELLED; }

  getValue(): GiftCardStatusValue { return this.value; }

  isActive(): boolean { return this.value === GiftCardStatusValue.ACTIVE; }
  isRedeemed(): boolean { return this.value === GiftCardStatusValue.REDEEMED; }
  isExpired(): boolean { return this.value === GiftCardStatusValue.EXPIRED; }
  isCancelled(): boolean { return this.value === GiftCardStatusValue.CANCELLED; }

  equals(other: GiftCardStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
