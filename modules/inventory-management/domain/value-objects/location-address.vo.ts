import { DomainValidationError } from "../errors/inventory-management.errors";

// ISO 3166-1 alpha-2 country codes (subset of most common)
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const POSTAL_CODE_REGEX = /^[A-Z0-9\s\-]{3,10}$/i;

export interface LocationAddressProps {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export class LocationAddress {
  private constructor(private readonly props: LocationAddressProps) {}

  static create(props: LocationAddressProps): LocationAddress {
    if (props.country && !COUNTRY_CODE_REGEX.test(props.country.trim())) {
      throw new DomainValidationError(
        `Invalid country code: ${props.country}. Must be ISO 3166-1 alpha-2 (e.g. "US", "AU")`,
      );
    }
    if (props.postalCode && !POSTAL_CODE_REGEX.test(props.postalCode.trim())) {
      throw new DomainValidationError(
        `Invalid postal code: ${props.postalCode}`,
      );
    }
    if (props.addressLine1 && props.addressLine1.trim().length > 256) {
      throw new DomainValidationError(
        "Address line 1 cannot exceed 256 characters",
      );
    }
    if (props.city && props.city.trim().length > 128) {
      throw new DomainValidationError("City cannot exceed 128 characters");
    }
    return new LocationAddress({
      addressLine1: props.addressLine1?.trim(),
      addressLine2: props.addressLine2?.trim(),
      city: props.city?.trim(),
      state: props.state?.trim(),
      postalCode: props.postalCode?.trim().toUpperCase(),
      country: props.country?.trim().toUpperCase(),
      phone: props.phone?.trim(),
    });
  }

  get addressLine1(): string | undefined {
    return this.props.addressLine1;
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get postalCode(): string | undefined {
    return this.props.postalCode;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  equals(other: LocationAddress): boolean {
    return (
      this.props.addressLine1 === other.props.addressLine1 &&
      this.props.addressLine2 === other.props.addressLine2 &&
      this.props.city === other.props.city &&
      this.props.state === other.props.state &&
      this.props.postalCode === other.props.postalCode &&
      this.props.country === other.props.country &&
      this.props.phone === other.props.phone
    );
  }

  getValue(): LocationAddressProps {
    return { ...this.props };
  }

  toString(): string {
    const parts = [
      this.props.addressLine1,
      this.props.city,
      this.props.state,
      this.props.postalCode,
      this.props.country,
    ].filter(Boolean);
    return parts.join(", ");
  }
}
