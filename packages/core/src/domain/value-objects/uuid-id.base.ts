class InvalidUuidError extends Error {
  public readonly statusCode = 400;
  public readonly code = "INVALID_UUID_FORMAT";

  constructor(typeName: string, value: string) {
    super(`Invalid ${typeName} format: ${value}`);
    this.name = "InvalidUuidError";
  }
}

/**
 * Concrete semantic IDs declare their own private _uuidBrand for compile-time separation.
 * Keep that declaration on each wrapper: a private member shared here cannot distinguish them.
 * Declaration-only brands add no runtime fields or serialized data.
 */
export abstract class UuidId {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  protected constructor(
    private readonly value: string,
    private readonly typeName: string,
  ) {
    if (!UuidId.isValid(value)) {
      throw new InvalidUuidError(typeName, value);
    }
    this.value = value.toLowerCase();
  }

  static isValid(id: string): boolean {
    return typeof id === "string" && UuidId.UUID_REGEX.test(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UuidId | null | undefined): boolean {
    if (!other) return false;
    return (
      this.constructor === other.constructor &&
      this.typeName === other.typeName &&
      this.value === other.value
    );
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  getTypeName(): string {
    return this.typeName;
  }
}
