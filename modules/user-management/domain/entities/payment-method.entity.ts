import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { UserId } from '../value-objects/user-id.vo';
import { PaymentMethodId } from '../value-objects/payment-method-id.vo';
import { AddressId } from '../value-objects/address-id.vo';
import {
  DomainValidationError,
} from '../errors/user-management.errors';
import { PaymentMethodType } from '../value-objects/payment-method-type.vo';

// ============================================================================
// Domain Events
// ============================================================================

export class PaymentMethodAddedEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
    public readonly type: string,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.added'; }
  getPayload(): Record<string, unknown> {
    return { paymentMethodId: this.paymentMethodId, userId: this.userId, type: this.type };
  }
}

export class PaymentMethodExpiryUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
    public readonly expMonth: number,
    public readonly expYear: number,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.expiry_updated'; }
  getPayload(): Record<string, unknown> {
    return {
      paymentMethodId: this.paymentMethodId,
      userId: this.userId,
      expMonth: this.expMonth,
      expYear: this.expYear,
    };
  }
}

export class PaymentMethodBillingAddressUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
    public readonly billingAddressId: string | null,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.billing_address_updated'; }
  getPayload(): Record<string, unknown> {
    return {
      paymentMethodId: this.paymentMethodId,
      userId: this.userId,
      billingAddressId: this.billingAddressId,
    };
  }
}

export class PaymentMethodProviderRefUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.provider_ref_updated'; }
  getPayload(): Record<string, unknown> {
    return { paymentMethodId: this.paymentMethodId, userId: this.userId };
  }
}

export class PaymentMethodSetAsDefaultEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.set_as_default'; }
  getPayload(): Record<string, unknown> {
    return { paymentMethodId: this.paymentMethodId, userId: this.userId };
  }
}

export class PaymentMethodDefaultRemovedEvent extends DomainEvent {
  constructor(
    public readonly paymentMethodId: string,
    public readonly userId: string,
  ) {
    super(paymentMethodId, 'PaymentMethod');
  }
  get eventType(): string { return 'payment-method.default_removed'; }
  getPayload(): Record<string, unknown> {
    return { paymentMethodId: this.paymentMethodId, userId: this.userId };
  }
}

// ============================================================================
// Props Interface
// ============================================================================

export interface PaymentMethodProps {
  id: PaymentMethodId;
  userId: UserId;
  type: PaymentMethodType;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  billingAddressId: AddressId | null;
  providerRef: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO Interface
// ============================================================================

export interface PaymentMethodDTO {
  id: string;
  userId: string;
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  billingAddressId: string | null;
  providerRef: string | null;
  isDefault: boolean;
  displayName: string;
  expiryDisplay: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class PaymentMethod extends AggregateRoot {
  private constructor(private props: PaymentMethodProps) {
    super();
    PaymentMethod.validate(props);
  }

  // --- Static factories ---

  static create(params: {
    userId: string;
    type: PaymentMethodType;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    billingAddressId?: string;
    providerRef?: string;
    isDefault?: boolean;
  }): PaymentMethod {
    const now = new Date();
    const paymentMethod = new PaymentMethod({
      id: PaymentMethodId.create(),
      userId: UserId.fromString(params.userId),
      type: params.type,
      brand: params.brand ?? null,
      last4: params.last4 ?? null,
      expMonth: params.expMonth ?? null,
      expYear: params.expYear ?? null,
      billingAddressId: params.billingAddressId ? AddressId.fromString(params.billingAddressId) : null,
      providerRef: params.providerRef ?? null,
      isDefault: params.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
    paymentMethod.addDomainEvent(
      new PaymentMethodAddedEvent(
        paymentMethod.props.id.getValue(),
        params.userId,
        params.type,
      ),
    );
    return paymentMethod;
  }

  static fromPersistence(props: PaymentMethodProps): PaymentMethod {
    return new PaymentMethod(props);
  }

  private static validate(props: PaymentMethodProps): void {
    PaymentMethod.validateLast4(props.last4, props.type);
    PaymentMethod.validateExpiry(props.expMonth, props.expYear, props.type);
  }

  private static validateLast4(last4: string | null, type: PaymentMethodType): void {
    if (last4 && !/^\d{4}$/.test(last4)) {
      throw new DomainValidationError('last4 must be exactly 4 digits');
    }
    if (type === PaymentMethodType.CARD && !last4) {
      throw new DomainValidationError('Card payment methods must have last4 digits');
    }
  }

  private static validateExpiry(
    expMonth: number | null,
    expYear: number | null,
    type: PaymentMethodType,
  ): void {
    if (expMonth !== null && (expMonth < 1 || expMonth > 12)) {
      throw new DomainValidationError('Expiry month must be between 1 and 12');
    }
    if (expYear !== null && expYear < 1900) {
      throw new DomainValidationError('Expiry year must be a valid year');
    }
    if (type === PaymentMethodType.CARD && (expMonth === null || expYear === null)) {
      throw new DomainValidationError('Card payment methods must have expiry date');
    }
  }

  private static validateExpiryNotInPast(month: number, year: number): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new DomainValidationError('Expiry date cannot be in the past');
    }
  }

  // --- Native getters ---

  get id(): PaymentMethodId { return this.props.id; }
  get userId(): UserId { return this.props.userId; }
  get type(): PaymentMethodType { return this.props.type; }
  get brand(): string | null { return this.props.brand; }
  get last4(): string | null { return this.props.last4; }
  get expMonth(): number | null { return this.props.expMonth; }
  get expYear(): number | null { return this.props.expYear; }
  get billingAddressId(): AddressId | null { return this.props.billingAddressId; }
  get providerRef(): string | null { return this.props.providerRef; }
  get isDefault(): boolean { return this.props.isDefault; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Business methods ---

  updateExpiry(month: number, year: number): void {
    if (this.props.expMonth === month && this.props.expYear === year) return;
    PaymentMethod.validateExpiry(month, year, this.props.type);
    PaymentMethod.validateExpiryNotInPast(month, year);
    this.props.expMonth = month;
    this.props.expYear = year;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PaymentMethodExpiryUpdatedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
        month,
        year,
      ),
    );
  }

  updateBillingAddress(addressId: string | null): void {
    const newId = addressId ? AddressId.fromString(addressId) : null;
    const currentValue = this.props.billingAddressId?.getValue() ?? null;
    if (currentValue === addressId) return;
    this.props.billingAddressId = newId;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PaymentMethodBillingAddressUpdatedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
        addressId,
      ),
    );
  }

  updateProviderRef(providerRef: string | null): void {
    if (this.props.providerRef === providerRef) return;
    this.props.providerRef = providerRef;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PaymentMethodProviderRefUpdatedEvent(
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
      new PaymentMethodSetAsDefaultEvent(
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
      new PaymentMethodDefaultRemovedEvent(
        this.props.id.getValue(),
        this.props.userId.getValue(),
      ),
    );
  }

  // --- Query methods ---

  isExpired(): boolean {
    if (!this.props.expMonth || !this.props.expYear) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (this.props.expYear < currentYear) return true;
    if (this.props.expYear === currentYear && this.props.expMonth < currentMonth) return true;
    return false;
  }

  isExpiringThisMonth(): boolean {
    if (!this.props.expMonth || !this.props.expYear) return false;
    const now = new Date();
    return this.props.expYear === now.getFullYear() && this.props.expMonth === now.getMonth() + 1;
  }

  isExpiringSoon(monthsAhead: number = 3): boolean {
    if (!this.props.expMonth || !this.props.expYear) return false;
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, now.getDate());
    const futureYear = futureDate.getFullYear();
    const futureMonth = futureDate.getMonth() + 1;
    if (this.props.expYear < futureYear) return true;
    if (this.props.expYear === futureYear && this.props.expMonth <= futureMonth) return true;
    return false;
  }

  canBeUsedForPayment(): boolean {
    return !this.isExpired();
  }

  canBeUsedAsOnlyPaymentMethod(): boolean {
    return !this.isExpired();
  }

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  requiresBillingAddress(): boolean {
    return this.props.type === PaymentMethodType.CARD;
  }

  getDisplayName(): string {
    if (this.props.type === PaymentMethodType.CARD && this.props.last4) {
      const brandDisplay = this.props.brand ? `${this.props.brand} ` : '';
      return `${brandDisplay}****${this.props.last4}`;
    }
    return this.props.type
      .replace('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getExpiryDisplay(): string {
    if (!this.props.expMonth || !this.props.expYear) return '';
    const month = this.props.expMonth.toString().padStart(2, '0');
    const year = this.props.expYear.toString().slice(-2);
    return `${month}/${year}`;
  }

  equals(other: PaymentMethod): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(pm: PaymentMethod): PaymentMethodDTO {
    return {
      id: pm.id.getValue(),
      userId: pm.userId.getValue(),
      type: pm.type,
      brand: pm.brand,
      last4: pm.last4,
      expMonth: pm.expMonth,
      expYear: pm.expYear,
      billingAddressId: pm.billingAddressId?.getValue() ?? null,
      providerRef: pm.providerRef,
      isDefault: pm.isDefault,
      displayName: pm.getDisplayName(),
      expiryDisplay: pm.getExpiryDisplay(),
      isExpired: pm.isExpired(),
      createdAt: pm.createdAt.toISOString(),
      updatedAt: pm.updatedAt.toISOString(),
    };
  }
}
