import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ListPickupReservationsQuery } from "./list-pickup-reservations.query";
import { PickupReservationResult } from "./get-pickup-reservation.query";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export class ListPickupReservationsHandler implements IQueryHandler<
  ListPickupReservationsQuery,
  QueryResult<PickupReservationResult[]>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    query: ListPickupReservationsQuery,
  ): Promise<QueryResult<PickupReservationResult[]>> {
    try {
      let reservations;

      if (query.orderId) {
        reservations = await this.reservationService.getReservationsByOrder(
          query.orderId,
        );
      } else if (query.locationId) {
        reservations = await this.reservationService.getReservationsByLocation(
          query.locationId,
        );
      } else if (query.activeOnly) {
        reservations = await this.reservationService.getActiveReservations();
      } else {
        reservations = await this.reservationService.getAllReservations();
      }

      const results: PickupReservationResult[] = reservations.map(
        (reservation) => ({
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
        }),
      );

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
