import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { OrderId } from "../../../order-management/domain/value-objects/order-id.vo";
import { PickupReservation } from "../entities/pickup-reservation.entity";
import { ReservationId } from "../value-objects/reservation-id.vo";
import { ReservationStatusVO } from "../value-objects/reservation-status.vo";
import { LocationId } from "../value-objects/location-id.vo";

export interface IPickupReservationRepository {
  save(reservation: PickupReservation): Promise<void>;
  findById(reservationId: ReservationId): Promise<PickupReservation | null>;
  delete(reservationId: ReservationId): Promise<void>;
  findByOrder(orderId: OrderId): Promise<PickupReservation[]>;
  findByVariant(variantId: VariantId): Promise<PickupReservation[]>;
  findByLocation(locationId: LocationId): Promise<PickupReservation[]>;
  findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<PickupReservation[]>;
  findExpiredReservations(): Promise<PickupReservation[]>;
  findActiveReservations(): Promise<PickupReservation[]>;
  // findAll is paginated to match the canonical aggregate-repo shape.
  findAll(options?: PickupReservationQueryOptions): Promise<PaginatedResult<PickupReservation>>;
  findActiveByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<PickupReservation[]>;
  getTotalReservedQty(variantId: VariantId, locationId: LocationId): Promise<number>;
  exists(reservationId: ReservationId): Promise<boolean>;
}

export interface PickupReservationQueryOptions {
  limit?: number;
  offset?: number;
  status?: ReservationStatusVO;
  orderId?: OrderId;
  variantId?: VariantId;
  locationId?: LocationId;
  sortBy?: "expiresAt" | "id";
  sortOrder?: "asc" | "desc";
}
