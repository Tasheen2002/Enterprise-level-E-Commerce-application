import { DomainValidationError } from "../errors/inventory-management.errors";

export enum AlertType {
  LOW_STOCK = "low_stock",
  OOS = "oos",
  OVERSTOCK = "overstock",
}

export class AlertTypeVO {
  // Pattern D: shared static instances per allowed value.
  static readonly LOW_STOCK = new AlertTypeVO(AlertType.LOW_STOCK);
  static readonly OOS = new AlertTypeVO(AlertType.OOS);
  static readonly OVERSTOCK = new AlertTypeVO(AlertType.OVERSTOCK);

  private static readonly ALL: ReadonlyArray<AlertTypeVO> = [
    AlertTypeVO.LOW_STOCK,
    AlertTypeVO.OOS,
    AlertTypeVO.OVERSTOCK,
  ];


  private constructor(private readonly value: AlertType) {
    if (!Object.values(AlertType).includes(value)) {
      throw new DomainValidationError(
        `Invalid alert type: ${value}. Must be one of: ${Object.values(
          AlertType,
        ).join(", ")}`,
      );
    }
  }

  static create(value: string): AlertTypeVO {
    const normalized = value.toLowerCase();
    return (
      AlertTypeVO.ALL.find((t) => t.value === normalized) ??
      new AlertTypeVO(normalized as AlertType)
    );
  }

  static fromString(value: string): AlertTypeVO {
    return AlertTypeVO.create(value);
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
