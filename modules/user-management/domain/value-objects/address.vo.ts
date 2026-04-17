import { DomainValidationError } from "../errors/user-management.errors";

interface AddressProps {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export class Address {
  private readonly props: AddressProps;

  private constructor(props: AddressProps) {
    this.props = props;
  }

  static create(data: AddressData): Address {
    return new Address(Address.validate(data));
  }

  static fromData(data: AddressData): Address {
    return new Address(Address.validate(data));
  }

  private static validate(data: AddressData): AddressProps {
    if (!data.addressLine1?.trim()) {
      throw new DomainValidationError("Address line 1 is required");
    }
    if (!data.city?.trim()) {
      throw new DomainValidationError("City is required");
    }
    if (!data.country?.trim()) {
      throw new DomainValidationError("Country is required");
    }
    if (data.firstName && data.firstName.length > 50) {
      throw new DomainValidationError("First name is too long (maximum 50 characters)");
    }
    if (data.lastName && data.lastName.length > 50) {
      throw new DomainValidationError("Last name is too long (maximum 50 characters)");
    }
    if (data.addressLine1.length > 100) {
      throw new DomainValidationError("Address line 1 is too long (maximum 100 characters)");
    }
    if (data.addressLine2 && data.addressLine2.length > 100) {
      throw new DomainValidationError("Address line 2 is too long (maximum 100 characters)");
    }

    const country = data.country.trim().toUpperCase();
    if (data.postalCode && !Address.isValidPostalCode(data.postalCode, country)) {
      throw new DomainValidationError(`Invalid postal code format for ${country}`);
    }

    return {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      company: data.company?.trim(),
      addressLine1: data.addressLine1.trim(),
      addressLine2: data.addressLine2?.trim(),
      city: data.city.trim(),
      state: data.state?.trim(),
      postalCode: data.postalCode?.trim().toUpperCase(),
      country,
      phone: data.phone?.trim(),
    };
  }

  private static isValidPostalCode(postalCode: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
      UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
      FR: /^\d{5}$/,
      DE: /^\d{5}$/,
      AU: /^\d{4}$/,
      JP: /^\d{3}-?\d{4}$/,
      IN: /^\d{6}$/,
    };
    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(postalCode) : true;
  }

  get firstName(): string | undefined { return this.props.firstName; }
  get lastName(): string | undefined { return this.props.lastName; }
  get company(): string | undefined { return this.props.company; }
  get addressLine1(): string { return this.props.addressLine1; }
  get addressLine2(): string | undefined { return this.props.addressLine2; }
  get city(): string { return this.props.city; }
  get state(): string | undefined { return this.props.state; }
  get postalCode(): string | undefined { return this.props.postalCode; }
  get country(): string { return this.props.country; }
  get phone(): string | undefined { return this.props.phone; }

  getFullName(): string {
    const parts = [this.props.firstName, this.props.lastName].filter(Boolean);
    return parts.join(" ");
  }

  getFullAddress(): string {
    const parts = [
      this.props.addressLine1,
      this.props.addressLine2,
      this.props.city,
      this.props.state,
      this.props.postalCode,
      this.props.country,
    ].filter(Boolean);
    return parts.join(", ");
  }

  getFormattedAddress(): FormattedAddress {
    return {
      recipient: this.props.company || this.getFullName(),
      street: [this.props.addressLine1, this.props.addressLine2].filter(
        (line): line is string => Boolean(line),
      ),
      cityStateZip: [this.props.city, this.props.state, this.props.postalCode]
        .filter(Boolean)
        .join(", "),
      country: this.props.country,
    };
  }

  isSameCountry(other: Address): boolean {
    return this.props.country === other.props.country;
  }

  isInternational(fromCountry: string): boolean {
    return this.props.country !== fromCountry.toUpperCase();
  }

  isDomestic(fromCountry: string): boolean {
    return this.props.country === fromCountry.toUpperCase();
  }

  isComplete(): boolean {
    const required = [this.props.addressLine1, this.props.city, this.props.country];
    return required.every((f) => f && f.trim().length > 0);
  }

  isShippable(): boolean {
    return this.isComplete() && !!this.props.postalCode;
  }

  equals(other: Address): boolean {
    return (
      this.props.firstName === other.props.firstName &&
      this.props.lastName === other.props.lastName &&
      this.props.company === other.props.company &&
      this.props.addressLine1 === other.props.addressLine1 &&
      this.props.addressLine2 === other.props.addressLine2 &&
      this.props.city === other.props.city &&
      this.props.state === other.props.state &&
      this.props.postalCode === other.props.postalCode &&
      this.props.country === other.props.country &&
      this.props.phone === other.props.phone
    );
  }

  toString(): string {
    return this.getFullAddress();
  }

  getValue(): AddressData {
    return {
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      company: this.props.company,
      addressLine1: this.props.addressLine1,
      addressLine2: this.props.addressLine2,
      city: this.props.city,
      state: this.props.state,
      postalCode: this.props.postalCode,
      country: this.props.country,
      phone: this.props.phone,
    };
  }
}

export interface AddressData {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface FormattedAddress {
  recipient: string;
  street: string[];
  cityStateZip: string;
  country: string;
}

export class AddressType {
  static readonly BILLING = new AddressType('billing');
  static readonly SHIPPING = new AddressType('shipping');

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
