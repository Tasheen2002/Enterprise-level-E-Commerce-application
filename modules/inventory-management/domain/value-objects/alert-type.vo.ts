export enum AlertType {
  LOW_STOCK = "low_stock",
  OOS = "oos",
  OVERSTOCK = "overstock",
}

export class AlertTypeVO {
  private constructor(private readonly value: AlertType) {}

  static create(value: string): AlertTypeVO {
    const normalizedValue = value.toLowerCase();
    if (!Object.values(AlertType).includes(normalizedValue as AlertType)) {
      throw new Error(
        `Invalid alert type: ${value}. Must be one of: ${Object.values(
          AlertType,
        ).join(", ")}`,
      );
    }
    return new AlertTypeVO(normalizedValue as AlertType);
  }

  getValue(): AlertType {
    return this.value;
  }

  equals(other: AlertTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
