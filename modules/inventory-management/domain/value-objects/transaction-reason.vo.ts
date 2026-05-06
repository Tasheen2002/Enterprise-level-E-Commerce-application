import { DomainValidationError } from "../errors/inventory-management.errors";

export enum TransactionReason {
  RETURN = "return",
  ADJUSTMENT = "adjustment",
  PO = "po",
  ORDER = "order",
  DAMAGE = "damage",
  THEFT = "theft",
}

export class TransactionReasonVO {
  // Pattern D: shared static instances per allowed value.
  static readonly RETURN = new TransactionReasonVO(TransactionReason.RETURN);
  static readonly ADJUSTMENT = new TransactionReasonVO(TransactionReason.ADJUSTMENT);
  static readonly PO = new TransactionReasonVO(TransactionReason.PO);
  static readonly ORDER = new TransactionReasonVO(TransactionReason.ORDER);
  static readonly DAMAGE = new TransactionReasonVO(TransactionReason.DAMAGE);
  static readonly THEFT = new TransactionReasonVO(TransactionReason.THEFT);

  private static readonly ALL: ReadonlyArray<TransactionReasonVO> = [
    TransactionReasonVO.RETURN,
    TransactionReasonVO.ADJUSTMENT,
    TransactionReasonVO.PO,
    TransactionReasonVO.ORDER,
    TransactionReasonVO.DAMAGE,
    TransactionReasonVO.THEFT,
  ];

  // Validation lives in the constructor so BOTH `create()` (which trims +
  // lowercases) and `fromString()` (raw, for repository reconstitution)
  // validate. Both factories route through `create()` to get shared-instance
  // reference equality on success.
  private constructor(private readonly value: TransactionReason) {
    if (!Object.values(TransactionReason).includes(value)) {
      throw new DomainValidationError(
        `Invalid transaction reason: ${value}. Must be one of: ${Object.values(TransactionReason).join(", ")}`,
      );
    }
  }

  static create(value: string): TransactionReasonVO {
    const normalized = value.trim().toLowerCase();
    return (
      TransactionReasonVO.ALL.find((t) => t.value === normalized) ??
      new TransactionReasonVO(normalized as TransactionReason)
    );
  }

  static fromString(value: string): TransactionReasonVO {
    return TransactionReasonVO.create(value);
  }

  getValue(): TransactionReason {
    return this.value;
  }

  equals(other: TransactionReasonVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
