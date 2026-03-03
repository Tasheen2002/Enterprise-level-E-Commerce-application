import { UserId } from "../value-objects/user-id.vo";
import {
  Address as AddressVO,
  AddressData,
  AddressType,
} from "../value-objects/address.vo";

export class Address {
  private constructor(
    private readonly id: string, // UUID from database
    private readonly userId: UserId,
    private addressValue: AddressVO,
    private type: AddressType,
    private isDefault: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // Factory methods
  static create(data: CreateAddressData): Address {
    const addressId = crypto.randomUUID();
    const userId = UserId.fromString(data.userId);
    const addressValue = AddressVO.fromData(data.addressData);
    const now = new Date();

    return new Address(
      addressId,
      userId,
      addressValue,
      data.type,
      data.isDefault || false,
      now,
      now,
    );
  }

  static reconstitute(data: AddressEntityData): Address {
    return new Address(
      data.id,
      UserId.fromString(data.userId),
      AddressVO.fromData(data.addressData),
      data.type,
      data.isDefault,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Factory method from database row
  static fromDatabaseRow(row: UserAddressRow): Address {
    return new Address(
      row.address_id,
      UserId.fromString(row.user_id),
      // Map flat database columns to nested VO
      AddressVO.fromData({
        firstName: row.first_name || undefined,
        lastName: row.last_name || undefined,
        company: row.company || undefined,
        addressLine1: row.address_line_1,
        addressLine2: row.address_line_2 || undefined,
        city: row.city,
        state: row.state || undefined,
        postalCode: row.postal_code || undefined,
        country: row.country,
        phone: row.phone || undefined,
      }),
      AddressType.fromString(row.type),
      row.is_default,
      row.created_at,
      row.updated_at,
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getUserId(): UserId {
    return this.userId;
  }
  getAddressValue(): AddressVO {
    return this.addressValue;
  }
  getType(): AddressType {
    return this.type;
  }
  getIsDefault(): boolean {
    return this.isDefault;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  updateAddress(newAddressData: AddressData): void {
    const newAddressValue = AddressVO.fromData(newAddressData);

    if (this.addressValue.equals(newAddressValue)) {
      return; // No change needed
    }

    this.addressValue = newAddressValue;
    this.touch();
  }

  setAsDefault(): void {
    if (this.isDefault) {
      return; // Already default
    }

    this.isDefault = true;
    this.touch();
  }

  removeAsDefault(): void {
    if (!this.isDefault) {
      return; // Already not default
    }

    this.isDefault = false;
    this.touch();
  }

  changeType(newType: AddressType): void {
    if (this.type === newType) {
      return; // No change needed
    }

    this.type = newType;
    this.touch();
  }

  // Validation methods
  isValidForShipping(): boolean {
    return this.addressValue.isShippable();
  }

  isValidForBilling(): boolean {
    return this.addressValue.isComplete();
  }

  isSameAddress(other: Address): boolean {
    return this.addressValue.equals(other.addressValue);
  }

  belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    return true;
  }

  // Address-specific business methods
  calculateShippingZone(): ShippingZone {
    const country = this.addressValue.getCountry();

    switch (country) {
      case "US":
        return ShippingZone.DOMESTIC;
      case "CA":
      case "MX":
        return ShippingZone.NORTH_AMERICA;
      case "UK":
      case "FR":
      case "DE":
      case "IT":
      case "ES":
        return ShippingZone.EUROPE;
      default:
        return ShippingZone.INTERNATIONAL;
    }
  }

  estimateDeliveryDays(): number {
    const zone = this.calculateShippingZone();

    switch (zone) {
      case ShippingZone.DOMESTIC:
        return 3; // 1-3 business days
      case ShippingZone.NORTH_AMERICA:
        return 7; // 5-7 business days
      case ShippingZone.EUROPE:
        return 10; // 7-10 business days
      case ShippingZone.INTERNATIONAL:
        return 14; // 10-14 business days
      default:
        return 14;
    }
  }

  isInternationalShipping(fromCountry: string = "US"): boolean {
    return this.addressValue.isInternational(fromCountry);
  }

  requiresCustomsDeclaration(): boolean {
    return this.isInternationalShipping();
  }

  // Tax-related methods
  getTaxJurisdiction(): string {
    const country = this.addressValue.getCountry();
    const state = this.addressValue.getState();

    if (country === "US" && state) {
      return `${country}-${state}`;
    }

    return country;
  }

  // Address formatting for different purposes
  getShippingLabel(): AddressLabel {
    const formatted = this.addressValue.getFormattedAddress();

    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: "SHIPPING",
    };
  }

  getBillingLabel(): AddressLabel {
    const formatted = this.addressValue.getFormattedAddress();

    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: "BILLING",
    };
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  // Database-compatible persistence method
  toDatabaseRow(): UserAddressRow {
    const addressData = this.addressValue.toData();

    return {
      address_id: this.id,
      user_id: this.userId.getValue(),
      type: this.type.toString(),
      is_default: this.isDefault,
      first_name: addressData.firstName || null,
      last_name: addressData.lastName || null,
      company: addressData.company || null,
      address_line_1: addressData.addressLine1,
      address_line_2: addressData.addressLine2 || null,
      city: addressData.city,
      state: addressData.state || null,
      postal_code: addressData.postalCode || null,
      country: addressData.country,
      phone: addressData.phone || null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  toData(): AddressEntityData {
    return {
      id: this.id,
      userId: this.userId.getValue(),
      addressData: this.addressValue.toData(),
      type: this.type,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  equals(other: Address): boolean {
    return this.id === other.id;
  }
}

// Supporting types and enums
export enum ShippingZone {
  DOMESTIC = "domestic",
  NORTH_AMERICA = "north_america",
  EUROPE = "europe",
  INTERNATIONAL = "international",
}

export interface CreateAddressData {
  userId: string;
  addressData: AddressData;
  type: AddressType;
  isDefault?: boolean;
}

export interface AddressEntityData {
  id: string;
  userId: string;
  addressData: AddressData;
  type: AddressType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressLabel {
  recipient: string;
  addressLines: string[];
  cityStateZip: string;
  country: string;
  type: "SHIPPING" | "BILLING";
}

export interface UserAddressRow {
  address_id: string;
  user_id: string;
  type: string;
  is_default: boolean;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}
