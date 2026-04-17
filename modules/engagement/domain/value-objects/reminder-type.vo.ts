import { DomainValidationError } from "../errors/engagement.errors";
import { ReminderTypeEnum } from "../enums/engagement.enums";

export class ReminderType {
  private constructor(private readonly value: ReminderTypeEnum) {}

  static create(value: string): ReminderType {
    return ReminderType.fromString(value);
  }

  static fromString(value: string): ReminderType {
    const normalized = value.toLowerCase().trim();

    // Support legacy alias "back_in_stock" → restock
    const mapped = normalized === "back_in_stock" ? ReminderTypeEnum.RESTOCK : normalized;

    if (!Object.values(ReminderTypeEnum).includes(mapped as ReminderTypeEnum)) {
      throw new DomainValidationError(`Invalid reminder type: ${value}`);
    }

    return new ReminderType(mapped as ReminderTypeEnum);
  }

  static restock(): ReminderType {
    return new ReminderType(ReminderTypeEnum.RESTOCK);
  }

  static priceDrop(): ReminderType {
    return new ReminderType(ReminderTypeEnum.PRICE_DROP);
  }

  getValue(): string {
    return this.value;
  }

  isRestock(): boolean {
    return this.value === ReminderTypeEnum.RESTOCK;
  }

  isPriceDrop(): boolean {
    return this.value === ReminderTypeEnum.PRICE_DROP;
  }

  equals(other: ReminderType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
