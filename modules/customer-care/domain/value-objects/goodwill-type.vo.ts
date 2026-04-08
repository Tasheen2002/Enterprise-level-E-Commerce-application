export class GoodwillType {
  private constructor(private readonly value: string) {}

  static storeCredit(): GoodwillType {
    return new GoodwillType("store_credit");
  }

  static discount(): GoodwillType {
    return new GoodwillType("discount");
  }

  static points(): GoodwillType {
    return new GoodwillType("points");
  }

  static fromString(value: string): GoodwillType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "store_credit":
        return GoodwillType.storeCredit();
      case "discount":
        return GoodwillType.discount();
      case "points":
        return GoodwillType.points();
      default:
        throw new Error(`Invalid goodwill type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isStoreCredit(): boolean {
    return this.value === "store_credit";
  }

  isDiscount(): boolean {
    return this.value === "discount";
  }

  isPoints(): boolean {
    return this.value === "points";
  }

  equals(other: GoodwillType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
