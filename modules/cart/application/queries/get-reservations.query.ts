import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationsQuery extends IQuery {
  cartId: string;
  activeOnly?: boolean;
}

export class GetReservationsHandler implements IQueryHandler<GetReservationsQuery, QueryResult<ReservationDto[]>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsQuery): Promise<QueryResult<ReservationDto[]>> {
    const activeOnly = query.activeOnly !== false;
    const reservations = activeOnly
      ? await this.reservationService.getActiveCartReservations(query.cartId)
      : await this.reservationService.getCartReservations(query.cartId);
    return QueryResult.success<ReservationDto[]>(reservations);
  }
}
