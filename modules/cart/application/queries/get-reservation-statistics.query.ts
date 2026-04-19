import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationStatisticsDto } from "../services/reservation.service";

export interface GetReservationStatisticsQuery extends IQuery {}

export class GetReservationStatisticsHandler implements IQueryHandler<GetReservationStatisticsQuery, ReservationStatisticsDto> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(_query: GetReservationStatisticsQuery): Promise<ReservationStatisticsDto> {
    return this.reservationService.getReservationStatistics();
  }
}
