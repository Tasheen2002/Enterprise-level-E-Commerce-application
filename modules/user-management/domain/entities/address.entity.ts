import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { UserId } from "../value-objects/user-id.vo";
import { AddressId } from "../value-objects/address-id.vo";
import { Address as AddressVO } from "../value-objects/address.vo";
import { AddressType } from "../value-objects/address-type.vo";

// ============================================================================
// Domain Events
// ============================================================================

export class AddressCreatedEvent extends DomainEvent {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
  ) {
    super(addressId, "Address");
  }
  get eventType(): string {
    return "address.created";
  }
  getPayload(): Record<string, unknown> {
    return { addressId: this.addressId, userId: this.userId };
  }
}

export class AddressUpdatedEvent extends DomainEvent {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
  ) {
    super(addressId, "Address");
  }
  get eventType(): string {
    return "address.updated";
  }
  getPayload(): Record<string, unknown> {
    return { addressId: this.addressId, userId: this.userId };
  }
}

export class AddressSetAsDefaultEvent extends DomainEvent {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
  ) {
    super(addressId, "Address");
  }
  get eventType(): string {
    return "address.set_as_default";
  }
  getPayload(): Record<string, unknown> {
    return { addressId: this.addressId, userId: this.userId };
  }
}

export class AddressDefaultRemovedEvent extends DomainEvent {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
  ) {
    super(addressId, "Address");
  }
  get eventType(): string {
    return "address.default_removed";
  }
  getPayload(): Record<string, unknown> {
    return { addressId: this.addressId, userId: this.userId };
  }
}

export class AddressTypeChangedEvent extends DomainEvent {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
    public readonly previousType: string,
    public readonly newType: string,
  ) {
    super(addressId, "Address");
  }
  get eventType(): string {
    return "address.type_changed";
  }
  getPayload(): Record<string, unknown> {
    return {
      addressId: this.addressId,
      userId: this.userId,
      previousType: this.previousType,
      newType: this.newType,
    };
  }
}

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
    addressData: AddressInput;
    type: AddressType;
    isDefault?: boolean;
  }): Address {
    const now = new Date();
    const address = new Address({
      id: AddressId.create(),
      userId: UserId.fromString(params.userId),
      addressValue: AddressVO.create(params.addressData),
      type: params.type,
      isDefault: params.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
    address.addDomainEvent(
      new AddressCreatedEvent(address.props.id.getValue(), params.userId),
    );
    return address;
  }

  static fromPersistence(props: AddressProps): Address {
    return new Address(props);
  }

  // --- Native getters ---

  get id(): AddressId {
    return this.props.id;
  }
  get userId(): UserId {
    return this.props.userId;
  }
  get addressValue(): AddressVO {
    return this.props.addressValue;
  }
  get type(): AddressType {
    return this.props.type;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Business methods ---

  updateAddress(newAddressData: AddressInput): void {
    const newAddressValue = AddressVO.create(newAddressData);
    if (this.props.addressValue.equals(newAddressValue)) return;
    this.props.addressValue = newAddressValue;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new AddressUpdatedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
      ),
    );
  }

  setAsDefault(): void {
    if (this.props.isDefault) return;
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new AddressSetAsDefaultEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
      ),
    );
  }

  removeAsDefault(): void {
    if (!this.props.isDefault) return;
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new AddressDefaultRemovedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
      ),
    );
  }

  changeType(newType: AddressType): void {
    if (this.props.type.equals(newType)) return;
    const previousType = this.props.type;
    this.props.type = newType;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new AddressTypeChangedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
        previousType.getValue(),
        newType.getValue(),
      ),
    );
  }

  // --- Query methods ---

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

  equals(other: Address): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(address: Address): AddressDTO {
    const data = address.addressValue.getValue();
    return {
      id: address.id.getValue(),
      userId: address.userId.getValue(),
      type: address.type.toString(),
      isDefault: address.isDefault,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      company: data.company ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      country: data.country,
      phone: data.phone ?? null,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// Supporting input types
// ============================================================================

type AddressInput = Parameters<typeof AddressVO.create>[0];
