import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ReservationService, ReservationDto } from "../services/reservation.service";
import { GetReservationsQuery } from "./get-reservations.query";

export class GetReservationsHandler
  implements IQueryHandler<GetReservationsQuery, QueryResult<ReservationDto[]>>
{
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsQuery): Promise<QueryResult<ReservationDto[]>> {
    try {
      const activeOnly = query.activeOnly !== false;
      const reservations = activeOnly
        ? await this.reservationService.getActiveCartReservations(query.cartId)
        : await this.reservationService.getCartReservations(query.cartId);
      return QueryResult.success<ReservationDto[]>(reservations);
    } catch (error) {
      return QueryResult.failure<ReservationDto[]>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
