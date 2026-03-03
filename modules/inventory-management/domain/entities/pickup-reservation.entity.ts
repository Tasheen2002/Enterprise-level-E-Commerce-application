import { ReservationId } from "../value-objects/reservation-id.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

export interface PickupReservationProps {
  reservationId: ReservationId;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
  isCancelled?: boolean;
  isManuallyExpired?: boolean;
  isFulfilled?: boolean;
}

export class PickupReservation {
  private constructor(private readonly props: PickupReservationProps) {
    this.validate();
  }

  static create(
    props: Omit<
      PickupReservationProps,
      "isCancelled" | "isManuallyExpired" | "isFulfilled"
    >,
  ): PickupReservation {
    return new PickupReservation({
      ...props,
      isCancelled: false,
      isManuallyExpired: false,
      isFulfilled: false,
    });
  }

  static reconstitute(props: PickupReservationProps): PickupReservation {
    return new PickupReservation(props);
  }

  private validate(): void {
    if (this.props.qty <= 0) {
      throw new DomainValidationError("Reservation quantity must be greater than zero");
    }
  }

  getReservationId(): ReservationId {
    return this.props.reservationId;
  }

  getOrderId(): string {
    return this.props.orderId;
  }

  getVariantId(): string {
    return this.props.variantId;
  }

  getLocationId(): string {
    return this.props.locationId;
  }

  getQty(): number {
    return this.props.qty;
  }

  getExpiresAt(): Date {
    return this.props.expiresAt;
  }

  isActive(): boolean {
    return (
      !this.props.isCancelled && !this.props.isFulfilled && !this.isExpired()
    );
  }

  isCancelled(): boolean {
    return !!this.props.isCancelled;
  }

  isExpired(currentTime?: Date): boolean {
    if (this.props.isManuallyExpired) {
      return true;
    }

    if (!this.props.isCancelled && !this.props.isFulfilled) {
      const now = currentTime || new Date();
      return now > this.props.expiresAt;
    }

    return false;
  }

  isFulfilled(): boolean {
    return !!this.props.isFulfilled;
  }

  extendExpiration(newExpiresAt: Date): PickupReservation {
    if (newExpiresAt <= this.props.expiresAt) {
      throw new InvalidOperationError("New expiration must be later than current expiration");
    }
    if (!this.isActive()) {
      throw new InvalidOperationError("Cannot extend expiration of non-active reservation");
    }
    return new PickupReservation({
      ...this.props,
      expiresAt: newExpiresAt,
    });
  }

  cancel(): PickupReservation {
    if (!this.isActive()) {
      throw new InvalidOperationError("Can only cancel active reservations");
    }
    return new PickupReservation({
      ...this.props,
      isCancelled: true,
    });
  }

  markAsExpired(): PickupReservation {
    if (!this.isActive()) {
      throw new InvalidOperationError("Can only mark active reservations as expired");
    }
    return new PickupReservation({
      ...this.props,
      isManuallyExpired: true,
    });
  }

  fulfill(): PickupReservation {
    if (!this.isActive()) {
      throw new InvalidOperationError("Can only fulfill active reservations");
    }
    return new PickupReservation({
      ...this.props,
      isFulfilled: true,
    });
  }

  toJSON() {
    return {
      reservationId: this.props.reservationId.getValue(),
      orderId: this.props.orderId,
      variantId: this.props.variantId,
      locationId: this.props.locationId,
      qty: this.props.qty,
      expiresAt: this.props.expiresAt,
      isExpired: this.isExpired(),
      isActive: this.isActive(),
      isCancelled: this.isCancelled(),
      isFulfilled: this.isFulfilled(),
    };
  }
}
