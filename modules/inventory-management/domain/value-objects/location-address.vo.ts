import { DomainValidationError } from "../errors/inventory-management.errors";

export interface LocationAddressData {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

// Backwards-compatibility alias. New code should import `LocationAddressData`.
/** @deprecated Use `LocationAddressData`. */
export type LocationAddressProps = LocationAddressData;

const ADDRESS_LINE_MAX_LENGTH = 256;
const CITY_MAX_LENGTH = 128;

export class LocationAddress {
  
  private static readonly COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
  private static readonly POSTAL_CODE_REGEX = /^[A-Z0-9\s\-]{3,10}$/i;

  private constructor(private readonly props: LocationAddressData) {
    LocationAddress.validate(props);
  }

  
  static create(props: LocationAddressData): LocationAddress {
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

  
  static fromPersistence(props: LocationAddressData): LocationAddress {
    return new LocationAddress({ ...props });
  }

  private static validate(props: LocationAddressData): void {
    if (props.country && !LocationAddress.COUNTRY_CODE_REGEX.test(props.country)) {
      throw new DomainValidationError(
        `Invalid country code: ${props.country}. Must be ISO 3166-1 alpha-2 (e.g. "US", "AU")`,
      );
    }
    if (props.postalCode && !LocationAddress.POSTAL_CODE_REGEX.test(props.postalCode)) {
      throw new DomainValidationError(
        `Invalid postal code: ${props.postalCode}`,
      );
    }
    if (props.addressLine1 && props.addressLine1.length > ADDRESS_LINE_MAX_LENGTH) {
      throw new DomainValidationError(
        `Address line 1 cannot exceed ${ADDRESS_LINE_MAX_LENGTH} characters`,
      );
    }
    if (props.city && props.city.length > CITY_MAX_LENGTH) {
      throw new DomainValidationError(
        `City cannot exceed ${CITY_MAX_LENGTH} characters`,
      );
    }
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

  getValue(): LocationAddressData {
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
