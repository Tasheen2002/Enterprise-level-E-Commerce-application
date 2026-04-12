import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationQuery extends IQuery {
  reservationId: string;
}

export class GetReservationHandler implements IQueryHandler<GetReservationQuery, QueryResult<ReservationDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationQuery): Promise<QueryResult<ReservationDto>> {
    const reservation = await this.reservationService.getReservation(query.reservationId);
    return QueryResult.success<ReservationDto>(reservation!);
  }
}
