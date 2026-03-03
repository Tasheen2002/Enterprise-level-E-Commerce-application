export enum OrderSourceEnum {
  WEB = "web",
  MOBILE = "mobile",
}

export class OrderSource {
  private readonly value: OrderSourceEnum;

  private constructor(value: OrderSourceEnum) {
    this.value = value;
  }

  static fromString(value: string): OrderSource {
    const normalizedValue = value.toLowerCase();

    if (
      !Object.values(OrderSourceEnum).includes(
        normalizedValue as OrderSourceEnum,
      )
    ) {
      throw new Error(`Invalid order source: ${value}`);
    }

    return new OrderSource(normalizedValue as OrderSourceEnum);
  }

  static web(): OrderSource {
    return new OrderSource(OrderSourceEnum.WEB);
  }

  static mobile(): OrderSource {
    return new OrderSource(OrderSourceEnum.MOBILE);
  }

  getValue(): OrderSourceEnum {
    return this.value;
  }

  isWeb(): boolean {
    return this.value === OrderSourceEnum.WEB;
  }

  isMobile(): boolean {
    return this.value === OrderSourceEnum.MOBILE;
  }

  equals(other: OrderSource): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
