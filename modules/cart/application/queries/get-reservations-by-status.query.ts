import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationsByStatusQuery extends IQuery {
  status: "active" | "expiring_soon" | "expired" | "recently_expired";
}

export class GetReservationsByStatusHandler implements IQueryHandler<GetReservationsByStatusQuery, QueryResult<ReservationDto[]>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsByStatusQuery): Promise<QueryResult<ReservationDto[]>> {
    const reservations = await this.reservationService.getReservationsByStatus(query.status);
    return QueryResult.success<ReservationDto[]>(reservations);
  }
}
