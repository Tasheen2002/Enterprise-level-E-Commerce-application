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
  private readonly firstName: string;
  private readonly lastName: string;
  private readonly addressLine1: string;
  private readonly addressLine2?: string;
  private readonly city: string;
  private readonly state: string;
  private readonly postalCode: string;
  private readonly country: string;
  private readonly phone?: string;
  private readonly email?: string;

  private constructor(data: AddressSnapshotData) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.addressLine1 = data.addressLine1;
    this.addressLine2 = data.addressLine2;
    this.city = data.city;
    this.state = data.state;
    this.postalCode = data.postalCode;
    this.country = data.country;
    this.phone = data.phone;
    this.email = data.email;
  }

  static create(data: AddressSnapshotData): AddressSnapshot {
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new Error("First name is required");
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new Error("Last name is required");
    }

    if (!data.addressLine1 || data.addressLine1.trim().length === 0) {
      throw new Error("Address line 1 is required");
    }

    if (!data.city || data.city.trim().length === 0) {
      throw new Error("City is required");
    }

    if (!data.state || data.state.trim().length === 0) {
      throw new Error("State is required");
    }

    if (!data.postalCode || data.postalCode.trim().length === 0) {
      throw new Error("Postal code is required");
    }

    if (!data.country || data.country.trim().length === 0) {
      throw new Error("Country is required");
    }

    return new AddressSnapshot(data);
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
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

  getState(): string {
    return this.state;
  }

  getPostalCode(): string {
    return this.postalCode;
  }

  getCountry(): string {
    return this.country;
  }

  getPhone(): string | undefined {
    return this.phone;
  }

  getEmail(): string | undefined {
    return this.email;
  }

  toJSON(): AddressSnapshotData {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      phone: this.phone,
      email: this.email,
    };
  }

  equals(other: AddressSnapshot): boolean {
    return (
      this.firstName === other.firstName &&
      this.lastName === other.lastName &&
      this.addressLine1 === other.addressLine1 &&
      this.addressLine2 === other.addressLine2 &&
      this.city === other.city &&
      this.state === other.state &&
      this.postalCode === other.postalCode &&
      this.country === other.country &&
      this.phone === other.phone &&
      this.email === other.email
    );
  }
}
