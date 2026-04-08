export class ItemDisposition {
  private constructor(private readonly value: string) {}

  static restock(): ItemDisposition {
    return new ItemDisposition("restock");
  }

  static repair(): ItemDisposition {
    return new ItemDisposition("repair");
  }

  static discard(): ItemDisposition {
    return new ItemDisposition("discard");
  }

  static fromString(value: string): ItemDisposition {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "restock":
        return ItemDisposition.restock();
      case "repair":
        return ItemDisposition.repair();
      case "discard":
        return ItemDisposition.discard();
      default:
        throw new Error(`Invalid item disposition: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isRestock(): boolean {
    return this.value === "restock";
  }

  isRepair(): boolean {
    return this.value === "repair";
  }

  isDiscard(): boolean {
    return this.value === "discard";
  }

  equals(other: ItemDisposition): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
