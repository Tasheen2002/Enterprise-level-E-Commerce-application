export class ItemCondition {
  private constructor(private readonly value: string) {}

  static new(): ItemCondition {
    return new ItemCondition("new");
  }

  static used(): ItemCondition {
    return new ItemCondition("used");
  }

  static damaged(): ItemCondition {
    return new ItemCondition("damaged");
  }

  static fromString(value: string): ItemCondition {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "new":
        return ItemCondition.new();
      case "used":
        return ItemCondition.used();
      case "damaged":
        return ItemCondition.damaged();
      default:
        throw new Error(`Invalid item condition: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isNew(): boolean {
    return this.value === "new";
  }

  isUsed(): boolean {
    return this.value === "used";
  }

  isDamaged(): boolean {
    return this.value === "damaged";
  }

  equals(other: ItemCondition): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
