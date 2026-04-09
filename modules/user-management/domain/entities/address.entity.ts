import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { UserId } from "../value-objects/user-id.vo";
import { AddressId } from "../value-objects/address-id";
import {
  Address as AddressVO,
  AddressData,
  AddressType,
} from "../value-objects/address.vo";
import { ShippingZone } from "../enums/shipping-zone.enum";

export { ShippingZone, AddressId };

// Props interface
export interface AddressProps {
  id: AddressId;
  userId: UserId;
  addressValue: AddressVO;
  type: AddressType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Address extends AggregateRoot {
  private props: AddressProps;

  private constructor(props: AddressProps) {
    super();
    this.props = props;
  }

  // Factory methods
  static create(params: {
    userId: string;
    addressData: AddressData;
    type: AddressType;
    isDefault?: boolean;
  }): Address {
    const now = new Date();

    return new Address({
      id: AddressId.create(),
      userId: UserId.fromString(params.userId),
      addressValue: AddressVO.fromData(params.addressData),
      type: params.type,
      isDefault: params.isDefault || false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AddressProps): Address {
    return new Address(props);
  }

  // Getters
  getId(): AddressId {
    return this.props.id;
  }
  getUserId(): UserId {
    return this.props.userId;
  }
  getAddressValue(): AddressVO {
    return this.props.addressValue;
  }
  getType(): AddressType {
    return this.props.type;
  }
  getIsDefault(): boolean {
    return this.props.isDefault;
  }
  getCreatedAt(): Date {
    return this.props.createdAt;
  }
  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  updateAddress(newAddressData: AddressData): void {
    const newAddressValue = AddressVO.fromData(newAddressData);

    if (this.props.addressValue.equals(newAddressValue)) {
      return; // No change needed
    }

    this.props.addressValue = newAddressValue;
    this.props.updatedAt = new Date();
  }

  setAsDefault(): void {
    if (this.props.isDefault) {
      return; // Already default
    }

    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  removeAsDefault(): void {
    if (!this.props.isDefault) {
      return; // Already not default
    }

    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  changeType(newType: AddressType): void {
    if (this.props.type === newType) {
      return; // No change needed
    }

    this.props.type = newType;
    this.props.updatedAt = new Date();
  }

  // Validation methods
  isValidForShipping(): boolean {
    return this.props.addressValue.isShippable();
  }

  isValidForBilling(): boolean {
    return this.props.addressValue.isComplete();
  }

  isSameAddress(other: Address): boolean {
    return this.props.addressValue.equals(other.props.addressValue);
  }

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    return true;
  }

  // Address-specific business methods
  calculateShippingZone(): ShippingZone {
    const country = this.props.addressValue.getCountry();

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
    return this.props.addressValue.isInternational(fromCountry);
  }

  requiresCustomsDeclaration(): boolean {
    return this.isInternationalShipping();
  }

  // Tax-related methods
  getTaxJurisdiction(): string {
    const country = this.props.addressValue.getCountry();
    const state = this.props.addressValue.getState();

    if (country === "US" && state) {
      return `${country}-${state}`;
    }

    return country;
  }

  // Address formatting for different purposes
  getShippingLabel(): AddressLabel {
    const formatted = this.props.addressValue.getFormattedAddress();

    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: "SHIPPING",
    };
  }

  getBillingLabel(): AddressLabel {
    const formatted = this.props.addressValue.getFormattedAddress();

    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: "BILLING",
    };
  }

  // Static DTO conversion — called by service, NEVER by handler or controller
  static toDTO(address: Address): AddressDTO {
    const data = address.props.addressValue.toData();
    return {
      id: address.props.id.getValue(),
      userId: address.props.userId.getValue(),
      type: address.props.type.toString(),
      isDefault: address.props.isDefault,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      company: data.company || null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country,
      phone: data.phone || null,
      createdAt: address.props.createdAt.toISOString(),
      updatedAt: address.props.updatedAt.toISOString(),
    };
  }

  equals(other: Address): boolean {
    return this.props.id.equals(other.props.id);
  }
}

export interface AddressLabel {
  recipient: string;
  addressLines: string[];
  cityStateZip: string;
  country: string;
  type: "SHIPPING" | "BILLING";
}

// DTO Interface
export interface AddressDTO {
  id: string;
  userId: string;
  type: string;
  isDefault: boolean;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}
