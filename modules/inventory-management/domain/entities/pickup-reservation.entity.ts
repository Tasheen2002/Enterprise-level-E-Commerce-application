import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { ReservationId } from "../value-objects/reservation-id.vo";
import { ReservationStatusVO } from "../value-objects/reservation-status.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class PickupReservationCreatedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly qty: number,
  ) {
    super(reservationId, "PickupReservation");
  }
  get eventType(): string {
    return "pickup_reservation.created";
  }
  getPayload(): Record<string, unknown> {
    return {
      reservationId: this.reservationId,
      orderId: this.orderId,
      variantId: this.variantId,
      locationId: this.locationId,
      qty: this.qty,
    };
  }
}

export class PickupReservationCancelledEvent extends DomainEvent {
  constructor(public readonly reservationId: string) {
    super(reservationId, "PickupReservation");
  }
  get eventType(): string {
    return "pickup_reservation.cancelled";
  }
  getPayload(): Record<string, unknown> {
    return { reservationId: this.reservationId };
  }
}

export class PickupReservationExpiredEvent extends DomainEvent {
  constructor(public readonly reservationId: string) {
    super(reservationId, "PickupReservation");
  }
  get eventType(): string {
    return "pickup_reservation.expired";
  }
  getPayload(): Record<string, unknown> {
    return { reservationId: this.reservationId };
  }
}

export class PickupReservationFulfilledEvent extends DomainEvent {
  constructor(public readonly reservationId: string) {
    super(reservationId, "PickupReservation");
  }
  get eventType(): string {
    return "pickup_reservation.fulfilled";
  }
  getPayload(): Record<string, unknown> {
    return { reservationId: this.reservationId };
  }
}

export class PickupReservationExtendedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly newExpiresAt: Date,
  ) {
    super(reservationId, "PickupReservation");
  }
  get eventType(): string {
    return "pickup_reservation.extended";
  }
  getPayload(): Record<string, unknown> {
    return {
      reservationId: this.reservationId,
      newExpiresAt: this.newExpiresAt.toISOString(),
    };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface PickupReservationProps {
  reservationId: ReservationId;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
  status: ReservationStatusVO;
}

export interface PickupReservationDTO {
  reservationId: string;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: string;
  status: string;
  isActive: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  isFulfilled: boolean;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class PickupReservation extends AggregateRoot {
  private constructor(private props: PickupReservationProps) {
    super();
  }

  private static validateQty(qty: number): void {
    if (qty <= 0) {
      throw new DomainValidationError(
        "Reservation quantity must be greater than zero",
      );
    }
  }

  static create(params: {
    orderId: string;
    variantId: string;
    locationId: string;
    qty: number;
    expiresAt: Date;
  }): PickupReservation {
    PickupReservation.validateQty(params.qty);
    const reservation = new PickupReservation({
      reservationId: ReservationId.create(),
      orderId: params.orderId,
      variantId: params.variantId,
      locationId: params.locationId,
      qty: params.qty,
      expiresAt: params.expiresAt,
      status: ReservationStatusVO.active(),
    });
    reservation.addDomainEvent(
      new PickupReservationCreatedEvent(
        reservation.props.reservationId.getValue(),
        params.orderId,
        params.variantId,
        params.locationId,
        params.qty,
      ),
    );
    return reservation;
  }

  static fromPersistence(props: PickupReservationProps): PickupReservation {
    return new PickupReservation(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get reservationId(): ReservationId {
    return this.props.reservationId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get variantId(): string {
    return this.props.variantId;
  }
  get locationId(): string {
    return this.props.locationId;
  }
  get qty(): number {
    return this.props.qty;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get status(): ReservationStatusVO {
    return this.props.status;
  }

  // ── Business Logic ─────────────────────────────────────────────────

  isActive(currentTime?: Date): boolean {
    if (!this.props.status.isActive()) return false;
    const now = currentTime ?? new Date();
    return now <= this.props.expiresAt;
  }

  isCancelled(): boolean {
    return this.props.status.isCancelled();
  }

  isExpired(currentTime?: Date): boolean {
    if (this.props.status.isExpired()) return true;
    if (this.props.status.isActive()) {
      const now = currentTime ?? new Date();
      return now > this.props.expiresAt;
    }
    return false;
  }

  isFulfilled(): boolean {
    return this.props.status.isFulfilled();
  }

  extendExpiration(newExpiresAt: Date): void {
    if (newExpiresAt <= this.props.expiresAt) {
      throw new InvalidOperationError(
        "New expiration must be later than current expiration",
      );
    }
    if (!this.isActive()) {
      throw new InvalidOperationError(
        "Cannot extend expiration of non-active reservation",
      );
    }
    this.props.expiresAt = newExpiresAt;
    this.addDomainEvent(
      new PickupReservationExtendedEvent(
        this.props.reservationId.getValue(),
        newExpiresAt,
      ),
    );
  }

  cancel(): void {
    if (!this.isActive()) {
      throw new InvalidOperationError("Can only cancel active reservations");
    }
    this.props.status = ReservationStatusVO.cancelled();
    this.addDomainEvent(
      new PickupReservationCancelledEvent(this.props.reservationId.getValue()),
    );
  }

  markAsExpired(): void {
    if (!this.isActive()) {
      throw new InvalidOperationError(
        "Can only mark active reservations as expired",
      );
    }
    this.props.status = ReservationStatusVO.expired();
    this.addDomainEvent(
      new PickupReservationExpiredEvent(this.props.reservationId.getValue()),
    );
  }

  fulfill(): void {
    if (!this.isActive()) {
      throw new InvalidOperationError("Can only fulfill active reservations");
    }
    this.props.status = ReservationStatusVO.fulfilled();
    this.addDomainEvent(
      new PickupReservationFulfilledEvent(this.props.reservationId.getValue()),
    );
  }

  equals(other: PickupReservation): boolean {
    return this.props.reservationId.equals(other.props.reservationId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: PickupReservation): PickupReservationDTO {
    return {
      reservationId: entity.props.reservationId.getValue(),
      orderId: entity.props.orderId,
      variantId: entity.props.variantId,
      locationId: entity.props.locationId,
      qty: entity.props.qty,
      expiresAt: entity.props.expiresAt.toISOString(),
      status: entity.props.status.getValue(),
      isActive: entity.isActive(),
      isExpired: entity.isExpired(),
      isCancelled: entity.isCancelled(),
      isFulfilled: entity.isFulfilled(),
    };
  }
}
