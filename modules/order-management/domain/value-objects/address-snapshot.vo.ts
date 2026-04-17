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
  private readonly props: AddressSnapshotData;

  private constructor(data: AddressSnapshotData) {
    this.props = { ...data };
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

  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }
  get addressLine1(): string { return this.props.addressLine1; }
  get addressLine2(): string | undefined { return this.props.addressLine2; }
  get city(): string { return this.props.city; }
  get state(): string { return this.props.state; }
  get postalCode(): string { return this.props.postalCode; }
  get country(): string { return this.props.country; }
  get phone(): string | undefined { return this.props.phone; }
  get email(): string | undefined { return this.props.email; }

  getValue(): AddressSnapshotData {
    return { ...this.props };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: AddressSnapshot): boolean {
    return (
      this.props.firstName === other.props.firstName &&
      this.props.lastName === other.props.lastName &&
      this.props.addressLine1 === other.props.addressLine1 &&
      this.props.addressLine2 === other.props.addressLine2 &&
      this.props.city === other.props.city &&
      this.props.state === other.props.state &&
      this.props.postalCode === other.props.postalCode &&
      this.props.country === other.props.country &&
      this.props.phone === other.props.phone &&
      this.props.email === other.props.email
    );
  }
}
