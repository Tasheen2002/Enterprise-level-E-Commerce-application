import { DomainValidationError } from "../errors";

export class SKU {
  private constructor(private readonly value: string) {
    if (!value) {
      throw new DomainValidationError("SKU cannot be empty");
    }

    if (!this.isValidSKU(value)) {
      throw new DomainValidationError(
        "SKU must contain only uppercase letters, numbers, and hyphens",
      );
    }

    if (value.length > 50) {
      throw new DomainValidationError("SKU cannot be longer than 50 characters");
    }
  }

  static create(value: string): SKU {
    const normalizedSKU = value.toUpperCase().trim();
    return new SKU(normalizedSKU);
  }

  static fromString(value: string): SKU {
    return new SKU(value);
  }

  static generateFromProductInfo(
    brand: string,
    category: string,
    color?: string,
    size?: string,
  ): SKU {
    const parts = [
      brand.substring(0, 3).toUpperCase(),
      category.substring(0, 3).toUpperCase(),
    ];

    if (color) {
      parts.push(color.substring(0, 3).toUpperCase());
    }

    if (size) {
      parts.push(size.replace(/[^A-Z0-9]/g, "").toUpperCase());
    }

    // Add timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    parts.push(timestamp);

    return new SKU(parts.join("-"));
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

  private isValidSKU(sku: string): boolean {
    const skuRegex = /^[A-Z0-9-]+$/;
    return skuRegex.test(sku);
  }
}
