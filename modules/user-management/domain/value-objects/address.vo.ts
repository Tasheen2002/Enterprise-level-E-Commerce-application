export class Address {
  private readonly firstName?: string;
  private readonly lastName?: string;
  private readonly company?: string;
  private readonly addressLine1: string;
  private readonly addressLine2?: string;
  private readonly city: string;
  private readonly state?: string;
  private readonly postalCode?: string;
  private readonly country: string;
  private readonly phone?: string;

  constructor(data: AddressData) {
    // Validate required fields
    if (!data.addressLine1?.trim()) {
      throw new Error("Address line 1 is required");
    }
    if (!data.city?.trim()) {
      throw new Error("City is required");
    }
    if (!data.country?.trim()) {
      throw new Error("Country is required");
    }

    // Validate field lengths
    if (data.firstName && data.firstName.length > 50) {
      throw new Error("First name is too long (maximum 50 characters)");
    }
    if (data.lastName && data.lastName.length > 50) {
      throw new Error("Last name is too long (maximum 50 characters)");
    }
    if (data.addressLine1.length > 100) {
      throw new Error("Address line 1 is too long (maximum 100 characters)");
    }
    if (data.addressLine2 && data.addressLine2.length > 100) {
      throw new Error("Address line 2 is too long (maximum 100 characters)");
    }

    // Validate postal code format by country
    if (
      data.postalCode &&
      !this.isValidPostalCode(data.postalCode, data.country)
    ) {
      throw new Error(`Invalid postal code format for ${data.country}`);
    }

    // Assign values (trimmed and properly formatted)
    this.firstName = data.firstName?.trim();
    this.lastName = data.lastName?.trim();
    this.company = data.company?.trim();
    this.addressLine1 = data.addressLine1.trim();
    this.addressLine2 = data.addressLine2?.trim();
    this.city = data.city.trim();
    this.state = data.state?.trim();
    this.postalCode = data.postalCode?.trim().toUpperCase();
    this.country = data.country.trim().toUpperCase();
    this.phone = data.phone?.trim();
  }

  private isValidPostalCode(postalCode: string, country: string): boolean {
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
    return pattern ? pattern.test(postalCode) : true; // Allow any format for unlisted countries
  }

  // Getters
  getFirstName(): string | undefined {
    return this.firstName;
  }
  getLastName(): string | undefined {
    return this.lastName;
  }
  getCompany(): string | undefined {
    return this.company;
  }
  getAddressLine1(): string {
    return this.addressLine1;
  }
  getAddressLine2(): string | undefined {
    return this.addressLine2;
  }
  getCity(): string {
    return this.city;
  }
  getState(): string | undefined {
    return this.state;
  }
  getPostalCode(): string | undefined {
    return this.postalCode;
  }
  getCountry(): string {
    return this.country;
  }
  getPhone(): string | undefined {
    return this.phone;
  }

  // Business methods
  getFullName(): string {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    return parts.join(" ");
  }

  getFullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  getFormattedAddress(): FormattedAddress {
    return {
      recipient: this.company || this.getFullName(),
      street: [this.addressLine1, this.addressLine2].filter(
        (line): line is string => Boolean(line)
      ),
      cityStateZip: [this.city, this.state, this.postalCode]
        .filter(Boolean)
        .join(", "),
      country: this.country,
    };
  }

  isSameCountry(other: Address): boolean {
    return this.country === other.country;
  }

  isInternational(fromCountry: string): boolean {
    return this.country !== fromCountry.toUpperCase();
  }

  isDomestic(fromCountry: string): boolean {
    return this.country === fromCountry.toUpperCase();
  }

  // Validation methods
  isComplete(): boolean {
    const requiredFields = [this.addressLine1, this.city, this.country];
    return requiredFields.every((field) => field && field.trim().length > 0);
  }

  isShippable(): boolean {
    // For shipping, we typically need more complete address
    return this.isComplete() && !!this.postalCode;
  }

  equals(other: Address): boolean {
    return (
      this.firstName === other.firstName &&
      this.lastName === other.lastName &&
      this.company === other.company &&
      this.addressLine1 === other.addressLine1 &&
      this.addressLine2 === other.addressLine2 &&
      this.city === other.city &&
      this.state === other.state &&
      this.postalCode === other.postalCode &&
      this.country === other.country &&
      this.phone === other.phone
    );
  }

  toString(): string {
    return this.getFullAddress();
  }

  static fromData(data: AddressData): Address {
    return new Address(data);
  }

  // Convert to data object for persistence
  toData(): AddressData {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      company: this.company,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      phone: this.phone,
    };
  }
}

// Supporting interfaces
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

// Address type enum for business logic
export enum AddressType {
  BILLING = "billing",
  SHIPPING = "shipping",
}

// ✅ ADD: Namespace with helper methods for database conversion
export namespace AddressType {
  export function fromString(type: string): AddressType {
    const normalized = type.toLowerCase().trim();

    switch (normalized) {
      case "billing":
        return AddressType.BILLING;
      case "shipping":
        return AddressType.SHIPPING;
      default:
        throw new Error(
          `Invalid address type: '${type}'. Must be 'billing' or 'shipping'`
        );
    }
  }

  export function toString(type: AddressType): string {
    return type.valueOf();
  }

  export function isValid(type: string): boolean {
    try {
      fromString(type);
      return true;
    } catch {
      return false;
    }
  }

  export function getAllValues(): AddressType[] {
    return [AddressType.BILLING, AddressType.SHIPPING];
  }

  export function getDisplayName(type: AddressType): string {
    switch (type) {
      case AddressType.BILLING:
        return "Billing Address";
      case AddressType.SHIPPING:
        return "Shipping Address";
      default:
        return type;
    }
  }
}
