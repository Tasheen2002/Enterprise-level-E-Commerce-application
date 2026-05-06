import { DomainValidationError } from "../errors/user-management.errors";

export class AddressType {
  static readonly BILLING = new AddressType('billing');
  static readonly SHIPPING = new AddressType('shipping');

  // Source of truth for the enum-like wire vocabulary. Validation schemas
  // derive their `z.enum` from this so adding a new value here automatically
  // widens the API contract without grepping for string literals.
  static readonly VALUES = ['billing', 'shipping'] as const;

  private constructor(private readonly value: string) {}

  static create(type: string): AddressType {
    const normalized = type.toLowerCase().trim();
    switch (normalized) {
      case 'billing':
        return AddressType.BILLING;
      case 'shipping':
        return AddressType.SHIPPING;
      default:
        throw new DomainValidationError(
          `Invalid address type: '${type}'. Must be 'billing' or 'shipping'`,
        );
    }
  }

  static fromString(type: string): AddressType {
    return AddressType.create(type);
  }

  static isValid(type: string): boolean {
    try {
      AddressType.create(type);
      return true;
    } catch {
      return false;
    }
  }

  static getAllValues(): AddressType[] {
    return [AddressType.BILLING, AddressType.SHIPPING];
  }

  getValue(): string {
    return this.value;
  }

  getDisplayName(): string {
    switch (this.value) {
      case 'billing':
        return 'Billing Address';
      case 'shipping':
        return 'Shipping Address';
      default:
        return this.value;
    }
  }

  equals(other: AddressType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
