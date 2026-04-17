import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { ReservationId } from "../value-objects/reservation-id.vo";
import { CartId } from "../value-objects/cart-id.vo";
import { VariantId } from "../value-objects/variant-id.vo";
import { Quantity } from "../value-objects/quantity.vo";
import { DomainValidationError, InvalidReservationOperationError } from "../errors";
import {
  RESERVATION_DEFAULT_DURATION_MINUTES,
  RESERVATION_MAX_DURATION_MINUTES,
  RESERVATION_EXPIRY_GRACE_PERIOD_HOURS,
  RESERVATION_EXPIRING_SOON_THRESHOLD_MINUTES,
} from "../constants";

// ============================================================================
// Domain Events
// ============================================================================

export class ReservationCreatedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly cartId: string,
    public readonly variantId: string,
    public readonly quantity: number,
  ) {
    super(reservationId, "Reservation");
  }

  get eventType(): string {
    return "reservation.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      reservationId: this.reservationId,
      cartId: this.cartId,
      variantId: this.variantId,
      quantity: this.quantity,
    };
  }
}

export class ReservationExtendedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly expiresAt: string,
  ) {
    super(reservationId, "Reservation");
  }

  get eventType(): string {
    return "reservation.extended";
  }

  getPayload(): Record<string, unknown> {
    return { reservationId: this.reservationId, expiresAt: this.expiresAt };
  }
}

// ============================================================================
// Props & Data Interfaces
// ============================================================================

export interface ReservationProps {
  reservationId: ReservationId;
  cartId: CartId;
  variantId: VariantId;
  quantity: Quantity;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservationData {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}

export interface ReservationEntityData {
  reservationId: string;
  cartId: string;
  variantId: string;
  quantity: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO
// ============================================================================

export interface ReservationDTO {
  reservationId: string;
  cartId: string;
  variantId: string;
  quantity: number;
  expiresAt: string;
  status: "active" | "expiring_soon" | "expired" | "recently_expired";
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpirySeconds: number;
  canBeExtended: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class Reservation extends AggregateRoot {
  private constructor(private props: ReservationProps) {
    super();
  }

  static create(data: CreateReservationData): Reservation {
    const reservationId = ReservationId.create();
    const durationMinutes = data.durationMinutes || RESERVATION_DEFAULT_DURATION_MINUTES;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const now = new Date();

    const reservation = new Reservation({
      reservationId,
      cartId: CartId.fromString(data.cartId),
      variantId: VariantId.fromString(data.variantId),
      quantity: Quantity.fromNumber(data.quantity),
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    reservation.addDomainEvent(
      new ReservationCreatedEvent(
        reservationId.getValue(),
        data.cartId,
        data.variantId,
        data.quantity,
      ),
    );

    return reservation;
  }

  static fromPersistence(data: ReservationEntityData): Reservation {
    return new Reservation({
      reservationId: ReservationId.fromString(data.reservationId),
      cartId: CartId.fromString(data.cartId),
      variantId: VariantId.fromString(data.variantId),
      quantity: Quantity.fromNumber(data.quantity),
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Getters
  get reservationId(): ReservationId {
    return this.props.reservationId;
  }

  get cartId(): CartId {
    return this.props.cartId;
  }

  get variantId(): VariantId {
    return this.props.variantId;
  }

  get quantity(): Quantity {
    return this.props.quantity;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateQuantity(newQuantity: number): void {
    this.props.quantity = Quantity.fromNumber(newQuantity);
  }

  incrementQuantity(amount: number = 1): void {
    this.updateQuantity(this.props.quantity.getValue() + amount);
  }

  decrementQuantity(amount: number = 1): void {
    const newQuantity = this.props.quantity.getValue() - amount;
    if (newQuantity <= 0) {
      throw new InvalidReservationOperationError(
        "Cannot decrease reservation quantity to zero or below. Use release() instead.",
      );
    }
    this.updateQuantity(newQuantity);
  }

  // Expiration management
  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  extend(additionalMinutes: number): void {
    if (additionalMinutes <= 0) {
      throw new DomainValidationError("Extension duration must be positive");
    }
    const now = new Date();
    const currentExpiry = this.isExpired ? now : this.props.expiresAt;
    this.props.expiresAt = new Date(currentExpiry.getTime() + additionalMinutes * 60 * 1000);
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new ReservationExtendedEvent(
        this.props.reservationId.getValue(),
        this.props.expiresAt.toISOString(),
      ),
    );
  }

  renew(durationMinutes: number = RESERVATION_DEFAULT_DURATION_MINUTES): void {
    if (durationMinutes <= 0) {
      throw new DomainValidationError("Renewal duration must be positive");
    }
    if (durationMinutes > RESERVATION_MAX_DURATION_MINUTES) {
      throw new DomainValidationError(
        `Renewal duration cannot exceed ${RESERVATION_MAX_DURATION_MINUTES} minutes`,
      );
    }
    this.props.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new ReservationExtendedEvent(
        this.props.reservationId.getValue(),
        this.props.expiresAt.toISOString(),
      ),
    );
  }

  get timeUntilExpirySeconds(): number {
    const timeLeft = this.props.expiresAt.getTime() - new Date().getTime();
    return Math.max(0, Math.floor(timeLeft / 1000));
  }

  get timeUntilExpiryMinutes(): number {
    return Math.floor(this.timeUntilExpirySeconds / 60);
  }

  isExpiringSoon(thresholdMinutes: number = RESERVATION_EXPIRING_SOON_THRESHOLD_MINUTES): boolean {
    const timeLeftMinutes = this.timeUntilExpiryMinutes;
    return timeLeftMinutes <= thresholdMinutes && timeLeftMinutes > 0;
  }

  get canBeExtended(): boolean {
    if (!this.isExpired) return true;
    const hoursSinceExpiry =
      (new Date().getTime() - this.props.expiresAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceExpiry <= RESERVATION_EXPIRY_GRACE_PERIOD_HOURS;
  }

  get status(): "active" | "expiring_soon" | "expired" | "recently_expired" {
    if (this.isExpired) {
      const hoursSinceExpiry =
        (new Date().getTime() - this.props.expiresAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceExpiry <= RESERVATION_EXPIRY_GRACE_PERIOD_HOURS
        ? "recently_expired"
        : "expired";
    }
    if (this.isExpiringSoon()) return "expiring_soon";
    return "active";
  }

  isValidForCart(cartId: string): boolean {
    return this.props.cartId.getValue() === cartId;
  }

  isValidForVariant(variantId: string): boolean {
    return this.props.variantId.getValue() === variantId;
  }

  canCover(requestedQuantity: number): boolean {
    return this.props.quantity.getValue() >= requestedQuantity && !this.isExpired;
  }

  equals(other: Reservation): boolean {
    return (
      this.props.reservationId.equals(other.props.reservationId) &&
      this.props.cartId.equals(other.props.cartId) &&
      this.props.variantId.equals(other.props.variantId)
    );
  }

  toSnapshot(): ReservationEntityData {
    return {
      reservationId: this.props.reservationId.getValue(),
      cartId: this.props.cartId.getValue(),
      variantId: this.props.variantId.getValue(),
      quantity: this.props.quantity.getValue(),
      expiresAt: this.props.expiresAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  // Static utility methods
  static createBulkReservations(
    cartId: string,
    items: Array<{ variantId: string; quantity: number }>,
    durationMinutes?: number,
  ): Reservation[] {
    return items.map((item) =>
      Reservation.create({ cartId, variantId: item.variantId, quantity: item.quantity, durationMinutes }),
    );
  }

  static getDefaultDurationMinutes(): number {
    return RESERVATION_DEFAULT_DURATION_MINUTES;
  }

  static getMaxDurationMinutes(): number {
    return RESERVATION_MAX_DURATION_MINUTES;
  }

  static toDTO(reservation: Reservation): ReservationDTO {
    return {
      reservationId: reservation.props.reservationId.getValue(),
      cartId: reservation.props.cartId.getValue(),
      variantId: reservation.props.variantId.getValue(),
      quantity: reservation.props.quantity.getValue(),
      expiresAt: reservation.props.expiresAt.toISOString(),
      status: reservation.status,
      isExpired: reservation.isExpired,
      isExpiringSoon: reservation.isExpiringSoon(),
      timeUntilExpirySeconds: reservation.timeUntilExpirySeconds,
      canBeExtended: reservation.canBeExtended,
      createdAt: reservation.props.createdAt.toISOString(),
      updatedAt: reservation.props.updatedAt.toISOString(),
    };
  }
}
