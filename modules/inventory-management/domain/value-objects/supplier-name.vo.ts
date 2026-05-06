import { DomainValidationError } from "../errors/inventory-management.errors";
import {
  SUPPLIER_NAME_MIN_LENGTH,
  SUPPLIER_NAME_MAX_LENGTH,
} from "../constants/inventory-management.constants";

// Pattern B (single-value domain VO).
//
// Validation lives in the **private constructor** so that BOTH `create()`
// and any future `fromPersistence()` path validate. Previously validation
// was inside `create()` only, meaning a reconstitution path would silently
// admit invalid values.
export class SupplierName {
  private constructor(private readonly value: string) {
    SupplierName.validate(value);
  }

  // Primary factory — normalizes (trim) before constructing so the
  // constructor's validation runs against the canonical form.
  static create(value: string): SupplierName {
    return new SupplierName(value?.trim() ?? "");
  }

  // Raw factory for repository reconstitution. The persisted value is
  // already in canonical form, so we skip normalization but the
  // constructor still validates.
  static fromString(value: string): SupplierName {
    return new SupplierName(value);
  }

  private static validate(value: string): void {
    if (!value || value.length < SUPPLIER_NAME_MIN_LENGTH) {
      throw new DomainValidationError(
        `Supplier name must be at least ${SUPPLIER_NAME_MIN_LENGTH} characters`,
      );
    }
    if (value.length > SUPPLIER_NAME_MAX_LENGTH) {
      throw new DomainValidationError(
        `Supplier name cannot exceed ${SUPPLIER_NAME_MAX_LENGTH} characters`,
      );
    }
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
