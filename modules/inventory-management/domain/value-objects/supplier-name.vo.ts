import { DomainValidationError } from "../errors/inventory-management.errors";

export class SupplierName {
  private constructor(private readonly value: string) {}

  static create(value: string): SupplierName {
    const trimmed = value?.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new DomainValidationError(
        "Supplier name must be at least 2 characters",
      );
    }
    if (trimmed.length > 128) {
      throw new DomainValidationError(
        "Supplier name cannot exceed 128 characters",
      );
    }
    return new SupplierName(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SupplierName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
