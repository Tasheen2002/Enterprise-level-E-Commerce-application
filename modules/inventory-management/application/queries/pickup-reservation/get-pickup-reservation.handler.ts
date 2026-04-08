import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetPickupReservationQuery,
  PickupReservationResult,
} from "./get-pickup-reservation.query";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export class GetPickupReservationHandler implements IQueryHandler<
  GetPickupReservationQuery,
  QueryResult<PickupReservationResult>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    query: GetPickupReservationQuery,
  ): Promise<QueryResult<PickupReservationResult>> {
    try {
      const reservation = await this.reservationService.getPickupReservation(
        query.reservationId,
      );

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
