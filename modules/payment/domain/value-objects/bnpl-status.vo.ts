import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum BnplStatusValue {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

/** @deprecated Use `BnplStatusValue`. */
export const BnplStatusEnum = BnplStatusValue;
/** @deprecated Use `BnplStatusValue`. */
export type BnplStatusEnum = BnplStatusValue;

// Pattern D (Enum-Like VO).
export class BnplStatus {
  static readonly PENDING = new BnplStatus(BnplStatusValue.PENDING);
  static readonly APPROVED = new BnplStatus(BnplStatusValue.APPROVED);
  static readonly REJECTED = new BnplStatus(BnplStatusValue.REJECTED);
  static readonly ACTIVE = new BnplStatus(BnplStatusValue.ACTIVE);
  static readonly COMPLETED = new BnplStatus(BnplStatusValue.COMPLETED);
  static readonly CANCELLED = new BnplStatus(BnplStatusValue.CANCELLED);
  static readonly FAILED = new BnplStatus(BnplStatusValue.FAILED);

  private static readonly ALL: ReadonlyArray<BnplStatus> = [
    BnplStatus.PENDING,
    BnplStatus.APPROVED,
    BnplStatus.REJECTED,
    BnplStatus.ACTIVE,
    BnplStatus.COMPLETED,
    BnplStatus.CANCELLED,
    BnplStatus.FAILED,
  ];

  private constructor(private readonly value: BnplStatusValue) {
    if (!Object.values(BnplStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid BNPL status: ${value}. Must be one of: ${Object.values(BnplStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): BnplStatus {
    const normalized = value.trim().toLowerCase();
    return (
      BnplStatus.ALL.find((t) => t.value === normalized) ??
      new BnplStatus(normalized as BnplStatusValue)
    );
  }

  static fromString(value: string): BnplStatus {
    return BnplStatus.create(value);
  }

  /** @deprecated Use `BnplStatus.PENDING`. */
  static pending(): BnplStatus { return BnplStatus.PENDING; }
  /** @deprecated Use `BnplStatus.APPROVED`. */
  static approved(): BnplStatus { return BnplStatus.APPROVED; }
  /** @deprecated Use `BnplStatus.REJECTED`. */
  static rejected(): BnplStatus { return BnplStatus.REJECTED; }
  /** @deprecated Use `BnplStatus.ACTIVE`. */
  static active(): BnplStatus { return BnplStatus.ACTIVE; }
  /** @deprecated Use `BnplStatus.COMPLETED`. */
  static completed(): BnplStatus { return BnplStatus.COMPLETED; }
  /** @deprecated Use `BnplStatus.CANCELLED`. */
  static cancelled(): BnplStatus { return BnplStatus.CANCELLED; }
  /** @deprecated Use `BnplStatus.FAILED`. */
  static failed(): BnplStatus { return BnplStatus.FAILED; }

  getValue(): BnplStatusValue { return this.value; }

  isPending(): boolean { return this.value === BnplStatusValue.PENDING; }
  isApproved(): boolean { return this.value === BnplStatusValue.APPROVED; }
  isRejected(): boolean { return this.value === BnplStatusValue.REJECTED; }
  isActive(): boolean { return this.value === BnplStatusValue.ACTIVE; }
  isCompleted(): boolean { return this.value === BnplStatusValue.COMPLETED; }
  isCancelled(): boolean { return this.value === BnplStatusValue.CANCELLED; }
  isFailed(): boolean { return this.value === BnplStatusValue.FAILED; }

  equals(other: BnplStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
