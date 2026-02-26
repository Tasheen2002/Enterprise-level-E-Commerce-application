import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface GetPickupReservationQuery extends IQuery {
  reservationId: string;
}

export interface PickupReservationResult {
  reservationId: string;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
  isExpired: boolean;
  isActive?: boolean;
  isCancelled?: boolean;
  isFulfilled?: boolean;
}

export class GetPickupReservationHandler implements IQueryHandler<
  GetPickupReservationQuery,
  QueryResult<PickupReservationResult | null>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    query: GetPickupReservationQuery,
  ): Promise<QueryResult<PickupReservationResult | null>> {
    try {
      if (!query.reservationId || query.reservationId.trim().length === 0) {
        return QueryResult.failure("reservationId: Reservation ID is required");
      }

      const reservation = await this.reservationService.getPickupReservation(
        query.reservationId,
      );

      if (!reservation) {
        return QueryResult.success<PickupReservationResult | null>(null);
      }

      const result: PickupReservationResult = {
        reservationId: reservation.getReservationId().getValue(),
        orderId: reservation.getOrderId(),
        variantId: reservation.getVariantId(),
        locationId: reservation.getLocationId(),
        qty: reservation.getQty(),
        expiresAt: reservation.getExpiresAt(),
        isExpired: reservation.isExpired(),
        isActive: reservation.isActive(),
        isCancelled: reservation.isCancelled(),
        isFulfilled: reservation.isFulfilled(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
