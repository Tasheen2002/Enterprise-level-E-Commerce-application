import { InvalidSkuError } from "../errors";

export class SKU {
  private static readonly MAX_LENGTH = 50;
  private static readonly SKU_REGEX = /^[A-Z0-9-]+$/;

  private constructor(private readonly value: string) {
    if (!value) {
      throw new InvalidSkuError("SKU cannot be empty");
    }
    if (!SKU.isValidSKU(value)) {
      throw new InvalidSkuError(
        "SKU must contain only uppercase letters, numbers, and hyphens",
      );
    }
    if (value.length > SKU.MAX_LENGTH) {
      throw new InvalidSkuError(
        `SKU cannot be longer than ${SKU.MAX_LENGTH} characters`,
      );
    }
  }

  static create(value: string): SKU {
    return new SKU(value.toUpperCase().trim());
  }

  static fromString(value: string): SKU {
    return new SKU(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static isValidSKU(sku: string): boolean {
    return SKU.SKU_REGEX.test(sku);
  }
}
