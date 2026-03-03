import {
  ReservationService,
  ReservationDto,
} from "../services/reservation.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetReservationByVariantQuery extends IQuery {
  cartId: string;
  variantId: string;
}

export class GetReservationByVariantHandler implements IQueryHandler<
  GetReservationByVariantQuery,
  QueryResult<ReservationDto | null>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    query: GetReservationByVariantQuery,
  ): Promise<QueryResult<ReservationDto | null>> {
    try {
      if (!query.cartId) {
        return QueryResult.failure<ReservationDto | null>("cartId: Cart ID is required");
      }

      if (!query.variantId) {
        return QueryResult.failure<ReservationDto | null>("variantId: Variant ID is required");
      }

      const reservations = await this.reservationService.getCartReservations(
        query.cartId,
      );
      const reservation = reservations.find(
        (r) => r.variantId === query.variantId,
      );

      return QueryResult.success<ReservationDto | null>(reservation || null);
    } catch (error) {
      return QueryResult.failure<ReservationDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
