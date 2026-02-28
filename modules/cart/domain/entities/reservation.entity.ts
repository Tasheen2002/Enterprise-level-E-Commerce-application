import { CartId } from "../value-objects/cart-id.vo";
import { VariantId } from "../value-objects/variant-id.vo";
import { Quantity } from "../value-objects/quantity.vo";
import { DomainValidationError } from "../errors";
import {
  RESERVATION_DEFAULT_DURATION_MINUTES,
  RESERVATION_MAX_DURATION_MINUTES,
  RESERVATION_EXPIRY_GRACE_PERIOD_HOURS,
  RESERVATION_EXPIRING_SOON_THRESHOLD_MINUTES,
} from "../constants";

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
}

export class Reservation {
  private constructor(
    private readonly reservationId: string,
    private readonly cartId: CartId,
    private readonly variantId: VariantId,
    private quantity: Quantity,
    private expiresAt: Date,
  ) {}

  // Factory methods
  static create(data: CreateReservationData): Reservation {
    const reservationId = crypto.randomUUID();
    const cartId = CartId.fromString(data.cartId);
    const variantId = VariantId.fromString(data.variantId);
    const quantity = Quantity.fromNumber(data.quantity);

    const durationMinutes = data.durationMinutes || RESERVATION_DEFAULT_DURATION_MINUTES;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    return new Reservation(
      reservationId,
      cartId,
      variantId,
      quantity,
      expiresAt,
    );
  }

  static reconstitute(data: ReservationEntityData): Reservation {
    const cartId = CartId.fromString(data.cartId);
    const variantId = VariantId.fromString(data.variantId);
    const quantity = Quantity.fromNumber(data.quantity);

    return new Reservation(
      data.reservationId,
      cartId,
      variantId,
      quantity,
      data.expiresAt,
    );
  }

  // Getters
  getReservationId(): string {
    return this.reservationId;
  }

  getCartId(): CartId {
    return this.cartId;
  }

  getVariantId(): VariantId {
    return this.variantId;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  // Business methods
  updateQuantity(newQuantity: number): void {
    this.quantity = Quantity.fromNumber(newQuantity);
  }

  incrementQuantity(amount: number = 1): void {
    const newQuantity = this.quantity.getValue() + amount;
    this.updateQuantity(newQuantity);
  }

  decrementQuantity(amount: number = 1): void {
    const newQuantity = this.quantity.getValue() - amount;
    if (newQuantity <= 0) {
      throw new DomainValidationError(
        "Cannot decrease reservation quantity to zero or below. Use release() instead.",
      );
    }
    this.updateQuantity(newQuantity);
  }

  // Expiration management
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  extend(additionalMinutes: number): void {
    if (additionalMinutes <= 0) {
      throw new DomainValidationError("Extension duration must be positive");
    }

    const now = new Date();
    const currentExpiry = this.isExpired() ? now : this.expiresAt;
    this.expiresAt = new Date(
      currentExpiry.getTime() + additionalMinutes * 60 * 1000,
    );
  }

  renew(durationMinutes: number = 30): void {
    if (durationMinutes <= 0) {
      throw new DomainValidationError("Renewal duration must be positive");
    }

    this.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  }

  getTimeUntilExpiry(): number {
    const now = new Date();
    const timeLeft = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeLeft / 1000)); // Returns seconds
  }

  getTimeUntilExpiryMinutes(): number {
    return Math.floor(this.getTimeUntilExpiry() / 60);
  }

  isExpiringSoon(thresholdMinutes: number = RESERVATION_EXPIRING_SOON_THRESHOLD_MINUTES): boolean {
    const timeLeftMinutes = this.getTimeUntilExpiryMinutes();
    return timeLeftMinutes <= thresholdMinutes && timeLeftMinutes > 0;
  }

  // Reservation status
  canBeExtended(): boolean {
    // Allow extension if reservation hasn't been expired for more than 1 hour
    if (!this.isExpired()) {
      return true;
    }

    const now = new Date();
    const hoursSinceExpiry =
      (now.getTime() - this.expiresAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceExpiry <= RESERVATION_EXPIRY_GRACE_PERIOD_HOURS;
  }

  getStatus(): "active" | "expiring_soon" | "expired" | "recently_expired" {
    if (this.isExpired()) {
      const now = new Date();
      const hoursSinceExpiry =
        (now.getTime() - this.expiresAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceExpiry <= RESERVATION_EXPIRY_GRACE_PERIOD_HOURS ? "recently_expired" : "expired";
    }

    if (this.isExpiringSoon()) {
      return "expiring_soon";
    }

    return "active";
  }

  // Validation methods
  isValidForCart(cartId: string): boolean {
    return this.cartId.getValue() === cartId;
  }

  isValidForVariant(variantId: string): boolean {
    return this.variantId.getValue() === variantId;
  }

  canCover(requestedQuantity: number): boolean {
    return this.quantity.getValue() >= requestedQuantity && !this.isExpired();
  }

  // Utility methods
  equals(other: Reservation): boolean {
    return (
      this.reservationId === other.reservationId &&
      this.cartId.equals(other.cartId) &&
      this.variantId.equals(other.variantId)
    );
  }

  toString(): string {
    return `Reservation(${this.reservationId}): ${this.quantity.getValue()} units of ${this.variantId.getValue()} for cart ${this.cartId.getValue()}, expires ${this.expiresAt.toISOString()}`;
  }

  toSnapshot(): ReservationEntityData {
    return {
      reservationId: this.reservationId,
      cartId: this.cartId.getValue(),
      variantId: this.variantId.getValue(),
      quantity: this.quantity.getValue(),
      expiresAt: this.expiresAt,
    };
  }

  // Summary for API responses
  getSummary() {
    const status = this.getStatus();
    return {
      reservationId: this.reservationId,
      cartId: this.cartId.getValue(),
      variantId: this.variantId.getValue(),
      quantity: this.quantity.getValue(),
      expiresAt: this.expiresAt,
      status,
      isExpired: this.isExpired(),
      isExpiringSoon: this.isExpiringSoon(),
      timeUntilExpirySeconds: this.getTimeUntilExpiry(),
      timeUntilExpiryMinutes: this.getTimeUntilExpiryMinutes(),
      canBeExtended: this.canBeExtended(),
    };
  }

  // Static utility methods
  static createBulkReservations(
    cartId: string,
    items: Array<{ variantId: string; quantity: number }>,
    durationMinutes?: number,
  ): Reservation[] {
    return items.map((item) =>
      Reservation.create({
        cartId,
        variantId: item.variantId,
        quantity: item.quantity,
        durationMinutes,
      }),
    );
  }

  static getDefaultDurationMinutes(): number {
    return RESERVATION_DEFAULT_DURATION_MINUTES;
  }

  static getMaxDurationMinutes(): number {
    return RESERVATION_MAX_DURATION_MINUTES;
  }
}
