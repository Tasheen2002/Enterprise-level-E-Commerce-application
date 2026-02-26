import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PickupReservationService } from "../../services/pickup-reservation.service";
import { PickupReservationResult } from "./get-pickup-reservation.query";

export interface ListPickupReservationsQuery extends IQuery {
  orderId?: string;
  locationId?: string;
  activeOnly?: boolean;
}

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

      // Handle activeOnly logic: true = active only, false = all reservations
      const showActiveOnly = query.activeOnly === true;

      if (showActiveOnly) {
        // Only active reservations
        if (query.orderId) {
          reservations = (
            await this.reservationService.getReservationsByOrder(query.orderId)
          ).filter((r: any) => r.isActive());
        } else if (query.locationId) {
          reservations = (
            await this.reservationService.getReservationsByLocation(
              query.locationId,
            )
          ).filter((r: any) => r.isActive());
        } else {
          reservations = await this.reservationService.getActiveReservations();
        }
      } else {
        // All reservations (active and inactive)
        if (query.orderId) {
          reservations = await this.reservationService.getReservationsByOrder(
            query.orderId,
          );
        } else if (query.locationId) {
          reservations =
            await this.reservationService.getReservationsByLocation(
              query.locationId,
            );
        } else {
          // Get all reservations (active, expired, cancelled, fulfilled)
          reservations = await this.reservationService.getAllReservations();
        }
      }

      const results: PickupReservationResult[] = (reservations as any[]).map(
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
