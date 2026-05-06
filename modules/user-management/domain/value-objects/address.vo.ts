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

interface FormattedAddress {
  recipient: string;
  street: string[];
  cityStateZip: string;
  country: string;
}

export class Address {
  private constructor(private readonly props: AddressProps) {
    Address.validate(props);
  }

  static create(data: AddressProps): Address {
    return new Address({
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      company: data.company?.trim(),
      addressLine1: data.addressLine1.trim(),
      addressLine2: data.addressLine2?.trim(),
      city: data.city.trim(),
      state: data.state?.trim(),
      postalCode: data.postalCode?.trim().toUpperCase(),
      country: data.country.trim().toUpperCase(),
      phone: data.phone?.trim(),
    });
  }

  static fromPersistence(data: AddressProps): Address {
    return new Address(data);
  }

  private static validate(data: AddressProps): void {
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

    if (data.postalCode && !Address.isValidPostalCode(data.postalCode, data.country.toUpperCase())) {
      throw new DomainValidationError(`Invalid postal code format for ${data.country}`);
    }
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
    const pattern = patterns[country];
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

  getValue(): AddressProps {
    return { ...this.props };
  }

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
}
