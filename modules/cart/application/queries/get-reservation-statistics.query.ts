import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationStatisticsDto } from "../services/reservation.service";

export interface GetReservationStatisticsQuery extends IQuery {}

export class GetReservationStatisticsHandler implements IQueryHandler<GetReservationStatisticsQuery, QueryResult<ReservationStatisticsDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(_query: GetReservationStatisticsQuery): Promise<QueryResult<ReservationStatisticsDto>> {
    const statistics = await this.reservationService.getReservationStatistics();
    return QueryResult.success<ReservationStatisticsDto>(statistics);
  }
}
