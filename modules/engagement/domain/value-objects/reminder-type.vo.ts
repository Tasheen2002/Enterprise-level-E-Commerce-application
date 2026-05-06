import { DomainValidationError } from "../errors/engagement.errors";

export enum ReminderTypeValue {
  RESTOCK = "restock",
  PRICE_DROP = "price_drop",
}

/** @deprecated Use `ReminderTypeValue`. */
export const ReminderTypeEnum = ReminderTypeValue;
/** @deprecated Use `ReminderTypeValue`. */
export type ReminderTypeEnum = ReminderTypeValue;

// Pattern D (Enum-Like VO).
export class ReminderType {
  static readonly RESTOCK = new ReminderType(ReminderTypeValue.RESTOCK);
  static readonly PRICE_DROP = new ReminderType(ReminderTypeValue.PRICE_DROP);

  private static readonly ALL: ReadonlyArray<ReminderType> = [
    ReminderType.RESTOCK,
    ReminderType.PRICE_DROP,
  ];

  private constructor(private readonly value: ReminderTypeValue) {
    if (!Object.values(ReminderTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid reminder type: ${value}. Must be one of: ${Object.values(ReminderTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): ReminderType {
    let normalized = value.trim().toLowerCase();
    // Support legacy alias "back_in_stock" → "restock".
    if (normalized === "back_in_stock") {
      normalized = ReminderTypeValue.RESTOCK;
    }
    return (
      ReminderType.ALL.find((t) => t.value === normalized) ??
      new ReminderType(normalized as ReminderTypeValue)
    );
  }

  static fromString(value: string): ReminderType {
    return ReminderType.create(value);
  }

  /** @deprecated Use `ReminderType.RESTOCK`. */
  static restock(): ReminderType { return ReminderType.RESTOCK; }
  /** @deprecated Use `ReminderType.PRICE_DROP`. */
  static priceDrop(): ReminderType { return ReminderType.PRICE_DROP; }

  getValue(): ReminderTypeValue { return this.value; }

  isRestock(): boolean { return this.value === ReminderTypeValue.RESTOCK; }
  isPriceDrop(): boolean { return this.value === ReminderTypeValue.PRICE_DROP; }

  equals(other: ReminderType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
