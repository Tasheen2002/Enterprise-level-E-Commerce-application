import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum PromotionStatusValue {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
  SCHEDULED = "scheduled",
}

/** @deprecated Use `PromotionStatusValue`. */
export const PromotionStatusEnum = PromotionStatusValue;
/** @deprecated Use `PromotionStatusValue`. */
export type PromotionStatusEnum = PromotionStatusValue;

// Pattern D (Enum-Like VO).
export class PromotionStatus {
  static readonly ACTIVE = new PromotionStatus(PromotionStatusValue.ACTIVE);
  static readonly INACTIVE = new PromotionStatus(PromotionStatusValue.INACTIVE);
  static readonly EXPIRED = new PromotionStatus(PromotionStatusValue.EXPIRED);
  static readonly SCHEDULED = new PromotionStatus(PromotionStatusValue.SCHEDULED);

  private static readonly ALL: ReadonlyArray<PromotionStatus> = [
    PromotionStatus.ACTIVE,
    PromotionStatus.INACTIVE,
    PromotionStatus.EXPIRED,
    PromotionStatus.SCHEDULED,
  ];

  private constructor(private readonly value: PromotionStatusValue) {
    if (!Object.values(PromotionStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid promotion status: ${value}. Must be one of: ${Object.values(PromotionStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): PromotionStatus {
    const normalized = value.trim().toLowerCase();
    return (
      PromotionStatus.ALL.find((t) => t.value === normalized) ??
      new PromotionStatus(normalized as PromotionStatusValue)
    );
  }

  static fromString(value: string): PromotionStatus {
    return PromotionStatus.create(value);
  }

  /** @deprecated Use `PromotionStatus.ACTIVE`. */
  static active(): PromotionStatus { return PromotionStatus.ACTIVE; }
  /** @deprecated Use `PromotionStatus.INACTIVE`. */
  static inactive(): PromotionStatus { return PromotionStatus.INACTIVE; }
  /** @deprecated Use `PromotionStatus.EXPIRED`. */
  static expired(): PromotionStatus { return PromotionStatus.EXPIRED; }
  /** @deprecated Use `PromotionStatus.SCHEDULED`. */
  static scheduled(): PromotionStatus { return PromotionStatus.SCHEDULED; }

  getValue(): PromotionStatusValue { return this.value; }

  isActive(): boolean { return this.value === PromotionStatusValue.ACTIVE; }
  isInactive(): boolean { return this.value === PromotionStatusValue.INACTIVE; }
  isExpired(): boolean { return this.value === PromotionStatusValue.EXPIRED; }
  isScheduled(): boolean { return this.value === PromotionStatusValue.SCHEDULED; }

  equals(other: PromotionStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
