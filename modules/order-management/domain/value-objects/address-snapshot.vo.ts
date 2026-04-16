import { DomainValidationError } from "../errors/order-management.errors";

export interface AddressSnapshotData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export class AddressSnapshot {
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _addressLine1: string;
  private readonly _addressLine2: string | undefined;
  private readonly _city: string;
  private readonly _state: string;
  private readonly _postalCode: string;
  private readonly _country: string;
  private readonly _phone: string | undefined;
  private readonly _email: string | undefined;

  private constructor(data: AddressSnapshotData) {
    this._firstName = data.firstName;
    this._lastName = data.lastName;
    this._addressLine1 = data.addressLine1;
    this._addressLine2 = data.addressLine2;
    this._city = data.city;
    this._state = data.state;
    this._postalCode = data.postalCode;
    this._country = data.country;
    this._phone = data.phone;
    this._email = data.email;
  }

  static create(data: AddressSnapshotData): AddressSnapshot {
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new DomainValidationError("First name is required");
    }
    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new DomainValidationError("Last name is required");
    }
    if (!data.addressLine1 || data.addressLine1.trim().length === 0) {
      throw new DomainValidationError("Address line 1 is required");
    }
    if (!data.city || data.city.trim().length === 0) {
      throw new DomainValidationError("City is required");
    }
    if (!data.state || data.state.trim().length === 0) {
      throw new DomainValidationError("State is required");
    }
    if (!data.postalCode || data.postalCode.trim().length === 0) {
      throw new DomainValidationError("Postal code is required");
    }
    if (!data.country || data.country.trim().length === 0) {
      throw new DomainValidationError("Country is required");
    }

    return new AddressSnapshot(data);
  }

  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }
  get addressLine1(): string {
    return this._addressLine1;
  }
  get addressLine2(): string | undefined {
    return this._addressLine2;
  }
  get city(): string {
    return this._city;
  }
  get state(): string {
    return this._state;
  }
  get postalCode(): string {
    return this._postalCode;
  }
  get country(): string {
    return this._country;
  }
  get phone(): string | undefined {
    return this._phone;
  }
  get email(): string | undefined {
    return this._email;
  }

  getValue(): AddressSnapshotData {
    return {
      firstName: this._firstName,
      lastName: this._lastName,
      addressLine1: this._addressLine1,
      addressLine2: this._addressLine2,
      city: this._city,
      state: this._state,
      postalCode: this._postalCode,
      country: this._country,
      phone: this._phone,
      email: this._email,
    };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: AddressSnapshot): boolean {
    return (
      this._firstName === other._firstName &&
      this._lastName === other._lastName &&
      this._addressLine1 === other._addressLine1 &&
      this._addressLine2 === other._addressLine2 &&
      this._city === other._city &&
      this._state === other._state &&
      this._postalCode === other._postalCode &&
      this._country === other._country &&
      this._phone === other._phone &&
      this._email === other._email
    );
  }
}
