export class ReminderType {
  private constructor(private readonly value: string) {}

  static restock(): ReminderType {
    return new ReminderType("restock");
  }

  static priceDrop(): ReminderType {
    return new ReminderType("price_drop");
  }

  static fromString(value: string): ReminderType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "restock":
      case "back_in_stock":
        return ReminderType.restock();
      case "price_drop":
        return ReminderType.priceDrop();
      default:
        throw new Error(`Invalid reminder type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isRestock(): boolean {
    return this.value === "restock";
  }

  isPriceDrop(): boolean {
    return this.value === "price_drop";
  }

  equals(other: ReminderType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
