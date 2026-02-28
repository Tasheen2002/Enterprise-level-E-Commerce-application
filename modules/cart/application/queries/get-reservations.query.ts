import {
  ReservationService,
  ReservationDto,
} from "../services/reservation.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetReservationsQuery extends IQuery {
  cartId: string;
  activeOnly?: boolean;
}

export class GetReservationsHandler implements IQueryHandler<
  GetReservationsQuery,
  QueryResult<ReservationDto[]>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    query: GetReservationsQuery,
  ): Promise<QueryResult<ReservationDto[]>> {
    try {
      if (!query.cartId) {
        return QueryResult.failure<ReservationDto[]>("cartId: Cart ID is required");
      }

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
