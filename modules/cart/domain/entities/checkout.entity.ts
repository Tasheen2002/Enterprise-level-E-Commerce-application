import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { CheckoutId } from "../value-objects/checkout-id.vo";
import { CartId } from "../value-objects/cart-id.vo";
import { CartOwnerId } from "../value-objects/cart-owner-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";
import { Currency } from "../value-objects/currency.vo";
import { CheckoutStatus } from "../value-objects/checkout-status.vo";
import {
  DomainValidationError,
  InvalidCheckoutStateError,
  InvalidOperationError,
} from "../errors";
import { CHECKOUT_DEFAULT_EXPIRY_MINUTES } from "../constants";

// ============================================================================
// Domain Events
// ============================================================================

export class CheckoutCreatedEvent extends DomainEvent {
  constructor(
    public readonly checkoutId: string,
    public readonly cartId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
  ) {
    super(checkoutId, "Checkout");
  }

  get eventType(): string {
    return "checkout.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      checkoutId: this.checkoutId,
      cartId: this.cartId,
      totalAmount: this.totalAmount,
      currency: this.currency,
    };
  }
}

export class CheckoutCompletedEvent extends DomainEvent {
  constructor(
    public readonly checkoutId: string,
    public readonly cartId: string,
    public readonly completedAt: string,
  ) {
    super(checkoutId, "Checkout");
  }

  get eventType(): string {
    return "checkout.completed";
  }

  getPayload(): Record<string, unknown> {
    return {
      checkoutId: this.checkoutId,
      cartId: this.cartId,
      completedAt: this.completedAt,
    };
  }
}

export class CheckoutExpiredEvent extends DomainEvent {
  constructor(public readonly checkoutId: string, public readonly cartId: string) {
    super(checkoutId, "Checkout");
  }

  get eventType(): string {
    return "checkout.expired";
  }

  getPayload(): Record<string, unknown> {
    return { checkoutId: this.checkoutId, cartId: this.cartId };
  }
}

export class CheckoutCancelledEvent extends DomainEvent {
  constructor(public readonly checkoutId: string, public readonly cartId: string) {
    super(checkoutId, "Checkout");
  }

  get eventType(): string {
    return "checkout.cancelled";
  }

  getPayload(): Record<string, unknown> {
    return { checkoutId: this.checkoutId, cartId: this.cartId };
  }
}

// ============================================================================
// Props & Data Interfaces
// ============================================================================

export interface CheckoutProps {
  checkoutId: CheckoutId;
  cartId: CartId;
  userId: CartOwnerId | null;
  guestToken: GuestToken | null;
  status: CheckoutStatus;
  totalAmount: number;
  currency: Currency;
  expiresAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckoutData {
  cartId: string;
  userId?: string;
  guestToken?: string;
  totalAmount: number;
  currency: string;
  expiresInMinutes?: number;
}

export interface CheckoutEntityData {
  checkoutId: string;
  cartId: string;
  userId?: string;
  guestToken?: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO
// ============================================================================

export interface CheckoutDTO {
  checkoutId: string;
  cartId: string;
  userId?: string;
  guestToken?: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isPending: boolean;
  isCompleted: boolean;
}

// ============================================================================
// Entity
// ============================================================================

export class Checkout extends AggregateRoot {
  private constructor(private props: CheckoutProps) {
    super();
    if (props.userId && props.guestToken) {
      throw new DomainValidationError("Checkout cannot belong to both user and guest");
    }
    if (!props.userId && !props.guestToken) {
      throw new DomainValidationError("Checkout must belong to either user or guest");
    }
    if (props.totalAmount < 0) {
      throw new DomainValidationError("Total amount cannot be negative");
    }
  }

  static create(data: CreateCheckoutData): Checkout {
    const checkoutId = CheckoutId.create();
    const now = new Date();
    const expiresInMinutes = data.expiresInMinutes || CHECKOUT_DEFAULT_EXPIRY_MINUTES;
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

    const checkout = new Checkout({
      checkoutId,
      cartId: CartId.fromString(data.cartId),
      userId: data.userId ? CartOwnerId.fromString(data.userId) : null,
      guestToken: data.guestToken ? GuestToken.fromString(data.guestToken) : null,
      status: CheckoutStatus.pending(),
      totalAmount: data.totalAmount,
      currency: Currency.fromString(data.currency),
      expiresAt,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    checkout.addDomainEvent(
      new CheckoutCreatedEvent(
        checkoutId.getValue(),
        data.cartId,
        data.totalAmount,
        data.currency,
      ),
    );

    return checkout;
  }

  static reconstitute(data: CheckoutEntityData): Checkout {
    return new Checkout({
      checkoutId: CheckoutId.fromString(data.checkoutId),
      cartId: CartId.fromString(data.cartId),
      userId: data.userId ? CartOwnerId.fromString(data.userId) : null,
      guestToken: data.guestToken ? GuestToken.fromString(data.guestToken) : null,
      status: CheckoutStatus.fromString(data.status),
      totalAmount: data.totalAmount,
      currency: Currency.fromString(data.currency),
      expiresAt: data.expiresAt,
      completedAt: data.completedAt || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static toDTO(checkout: Checkout): CheckoutDTO {
    return {
      checkoutId: checkout.props.checkoutId.getValue(),
      cartId: checkout.props.cartId.getValue(),
      userId: checkout.props.userId?.getValue(),
      guestToken: checkout.props.guestToken?.getValue(),
      status: checkout.props.status.getValue(),
      totalAmount: checkout.props.totalAmount,
      currency: checkout.props.currency.getValue(),
      expiresAt: checkout.props.expiresAt.toISOString(),
      completedAt: checkout.props.completedAt?.toISOString(),
      createdAt: checkout.props.createdAt.toISOString(),
      updatedAt: checkout.props.updatedAt.toISOString(),
      isExpired: checkout.isExpired,
      isPending: checkout.isPending,
      isCompleted: checkout.isCompleted,
    };
  }

  // Business methods
  markAsCompleted(completedAt: Date = new Date()): void {
    if (this.props.status.isCompleted()) {
      throw new InvalidCheckoutStateError("Checkout is already completed");
    }
    if (this.props.status.isExpired()) {
      throw new InvalidCheckoutStateError("Cannot complete an expired checkout");
    }
    if (this.props.status.isCancelled()) {
      throw new InvalidCheckoutStateError("Cannot complete a cancelled checkout");
    }
    this.props.status = CheckoutStatus.completed();
    this.props.completedAt = completedAt;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new CheckoutCompletedEvent(
        this.props.checkoutId.getValue(),
        this.props.cartId.getValue(),
        completedAt.toISOString(),
      ),
    );
  }

  markAsExpired(): void {
    if (this.props.status.isCompleted()) {
      throw new InvalidCheckoutStateError("Cannot expire a completed checkout");
    }
    this.props.status = CheckoutStatus.expired();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new CheckoutExpiredEvent(
        this.props.checkoutId.getValue(),
        this.props.cartId.getValue(),
      ),
    );
  }

  markAsCancelled(): void {
    if (this.props.status.isCompleted()) {
      throw new InvalidCheckoutStateError("Cannot cancel a completed checkout");
    }
    this.props.status = CheckoutStatus.cancelled();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new CheckoutCancelledEvent(
        this.props.checkoutId.getValue(),
        this.props.cartId.getValue(),
      ),
    );
  }

  transferToUser(userId: string): Checkout {
    if (this.props.userId) {
      throw new InvalidOperationError("Checkout already belongs to a user");
    }

    return new Checkout({
      ...this.props,
      userId: CartOwnerId.fromString(userId),
      guestToken: null,
      updatedAt: new Date(),
    });
  }

  // State checks
  get isExpired(): boolean {
    return this.props.expiresAt < new Date() || this.props.status.isExpired();
  }

  get isPending(): boolean {
    return this.props.status.isPending();
  }

  get isCompleted(): boolean {
    return this.props.status.isCompleted();
  }

  // Getters
  get checkoutId(): CheckoutId {
    return this.props.checkoutId;
  }

  get cartId(): CartId {
    return this.props.cartId;
  }

  get cartOwnerId(): CartOwnerId | null {
    return this.props.userId;
  }

  get guestToken(): GuestToken | null {
    return this.props.guestToken;
  }

  get status(): CheckoutStatus {
    return this.props.status;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  equals(other: Checkout): boolean {
    return this.props.checkoutId.equals(other.props.checkoutId);
  }

  toSnapshot(): CheckoutEntityData {
    return {
      checkoutId: this.props.checkoutId.getValue(),
      cartId: this.props.cartId.getValue(),
      userId: this.props.userId?.getValue(),
      guestToken: this.props.guestToken?.getValue(),
      status: this.props.status.getValue(),
      totalAmount: this.props.totalAmount,
      currency: this.props.currency.getValue(),
      expiresAt: this.props.expiresAt,
      completedAt: this.props.completedAt || undefined,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
