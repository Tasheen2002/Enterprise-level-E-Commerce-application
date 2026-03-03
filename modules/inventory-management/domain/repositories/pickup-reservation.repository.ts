import { PickupReservation } from "../entities/pickup-reservation.entity";
import { ReservationId } from "../value-objects/reservation-id.vo";

export interface IPickupReservationRepository {
  save(reservation: PickupReservation): Promise<void>;
  findById(reservationId: ReservationId): Promise<PickupReservation | null>;
  delete(reservationId: ReservationId): Promise<void>;
  findByOrder(orderId: string): Promise<PickupReservation[]>;
  findByVariant(variantId: string): Promise<PickupReservation[]>;
  findByLocation(locationId: string): Promise<PickupReservation[]>;
  findByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<PickupReservation[]>;
  findExpiredReservations(): Promise<PickupReservation[]>;
  findActiveReservations(): Promise<PickupReservation[]>;
  findAllReservations(): Promise<PickupReservation[]>;
  findActiveByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<PickupReservation[]>;
  getTotalReservedQty(variantId: string, locationId: string): Promise<number>;
  exists(reservationId: ReservationId): Promise<boolean>;
}
