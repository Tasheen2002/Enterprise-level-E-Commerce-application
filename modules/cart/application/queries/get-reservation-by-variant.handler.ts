import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ReservationService, ReservationDto } from "../services/reservation.service";
import { GetReservationByVariantQuery } from "./get-reservation-by-variant.query";

export class GetReservationByVariantHandler
  implements IQueryHandler<GetReservationByVariantQuery, QueryResult<ReservationDto | null>>
{
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationByVariantQuery): Promise<QueryResult<ReservationDto | null>> {
    try {
      const reservations = await this.reservationService.getCartReservations(query.cartId);
      const reservation = reservations.find((r) => r.variantId === query.variantId);
      return QueryResult.success<ReservationDto | null>(reservation || null);
    } catch (error) {
      return QueryResult.failure<ReservationDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
