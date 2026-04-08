export class RmaType {
  private constructor(private readonly value: string) {}

  static return(): RmaType {
    return new RmaType("return");
  }

  static exchange(): RmaType {
    return new RmaType("exchange");
  }

  static giftReturn(): RmaType {
    return new RmaType("gift_return");
  }

  static fromString(value: string): RmaType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "return":
        return RmaType.return();
      case "exchange":
        return RmaType.exchange();
      case "gift_return":
        return RmaType.giftReturn();
      default:
        throw new Error(`Invalid RMA type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isReturn(): boolean {
    return this.value === "return";
  }

  isExchange(): boolean {
    return this.value === "exchange";
  }

  isGiftReturn(): boolean {
    return this.value === "gift_return";
  }

  equals(other: RmaType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
