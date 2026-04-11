import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { UserId } from '../value-objects/user-id.vo';
import { AddressId } from '../value-objects/address-id';
import {
  Address as AddressVO,
  AddressData,
  AddressType,
} from '../value-objects/address.vo';
import { ShippingZone } from '../enums/shipping-zone.enum';

export { ShippingZone, AddressId };

// ============================================================================
// Props Interface
// ============================================================================

export interface AddressProps {
  id: AddressId;
  userId: UserId;
  addressValue: AddressVO;
  type: AddressType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO Interface
// ============================================================================

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

// ============================================================================
// Entity
// ============================================================================

export class Address extends AggregateRoot {
  private constructor(private props: AddressProps) {
    super();
  }

  // --- Static factories ---

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

  static fromPersistence(props: AddressProps): Address {
    return new Address(props);
  }

  // --- Native getters ---

  get id(): AddressId { return this.props.id; }
  get userId(): UserId { return this.props.userId; }
  get addressValue(): AddressVO { return this.props.addressValue; }
  get type(): AddressType { return this.props.type; }
  get isDefault(): boolean { return this.props.isDefault; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Business methods ---

  updateAddress(newAddressData: AddressData): void {
    const newAddressValue = AddressVO.fromData(newAddressData);
    if (this.props.addressValue.equals(newAddressValue)) return;
    this.props.addressValue = newAddressValue;
    this.props.updatedAt = new Date();
  }

  setAsDefault(): void {
    if (this.props.isDefault) return;
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  removeAsDefault(): void {
    if (!this.props.isDefault) return;
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  changeType(newType: AddressType): void {
    if (this.props.type === newType) return;
    this.props.type = newType;
    this.props.updatedAt = new Date();
  }

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

  calculateShippingZone(): ShippingZone {
    const country = this.props.addressValue.getCountry();
    switch (country) {
      case 'US': return ShippingZone.DOMESTIC;
      case 'CA':
      case 'MX': return ShippingZone.NORTH_AMERICA;
      case 'UK':
      case 'FR':
      case 'DE':
      case 'IT':
      case 'ES': return ShippingZone.EUROPE;
      default: return ShippingZone.INTERNATIONAL;
    }
  }

  estimateDeliveryDays(): number {
    switch (this.calculateShippingZone()) {
      case ShippingZone.DOMESTIC: return 3;
      case ShippingZone.NORTH_AMERICA: return 7;
      case ShippingZone.EUROPE: return 10;
      case ShippingZone.INTERNATIONAL: return 14;
      default: return 14;
    }
  }

  isInternationalShipping(fromCountry: string = 'US'): boolean {
    return this.props.addressValue.isInternational(fromCountry);
  }

  requiresCustomsDeclaration(): boolean {
    return this.isInternationalShipping();
  }

  getTaxJurisdiction(): string {
    const country = this.props.addressValue.getCountry();
    const state = this.props.addressValue.getState();
    if (country === 'US' && state) return `${country}-${state}`;
    return country;
  }

  getShippingLabel(): AddressLabel {
    const formatted = this.props.addressValue.getFormattedAddress();
    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: 'SHIPPING',
    };
  }

  getBillingLabel(): AddressLabel {
    const formatted = this.props.addressValue.getFormattedAddress();
    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: 'BILLING',
    };
  }

  equals(other: Address): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(address: Address): AddressDTO {
    const data = address.addressValue.toData();
    return {
      id: address.id.getValue(),
      userId: address.userId.getValue(),
      type: address.type.toString(),
      isDefault: address.isDefault,
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
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// Supporting types
// ============================================================================

export interface AddressLabel {
  recipient: string;
  addressLines: string[];
  cityStateZip: string;
  country: string;
  type: 'SHIPPING' | 'BILLING';
}
