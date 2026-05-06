import { DomainValidationError, EmptyFieldError } from "../errors/inventory-management.errors";
import {
  LOCATION_NAME_MIN_LENGTH,
  LOCATION_NAME_MAX_LENGTH,
} from "../constants/inventory-management.constants";

// Pattern B (single-value domain VO).
//
// Mirrors `SupplierName` — same shape, same constraints. Validation lives
// in the **private constructor** so that BOTH `create()` (which trims) and
// `fromString()` (raw, for repository reconstitution) validate.
export class LocationName {
  private constructor(private readonly value: string) {
    LocationName.validate(value);
  }

  // Primary factory — normalizes (trim) before constructing so the
  // constructor's validation runs against the canonical form.
  static create(value: string): LocationName {
    return new LocationName(value?.trim() ?? "");
  }

  // Raw factory for repository reconstitution. The persisted value is
  // already in canonical form, so we skip normalization but the
  // constructor still validates.
  static fromString(value: string): LocationName {
    return new LocationName(value);
  }

  private static validate(value: string): void {
    if (!value || value.length < LOCATION_NAME_MIN_LENGTH) {
      throw new EmptyFieldError("name");
    }
    if (value.length > LOCATION_NAME_MAX_LENGTH) {
      throw new DomainValidationError(
        `Location name cannot exceed ${LOCATION_NAME_MAX_LENGTH} characters`,
      );
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: LocationName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
