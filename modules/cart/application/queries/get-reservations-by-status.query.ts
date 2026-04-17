import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationsByStatusQuery extends IQuery {
  readonly status: "active" | "expiring_soon" | "expired" | "recently_expired";
}

export class GetReservationsByStatusHandler implements IQueryHandler<GetReservationsByStatusQuery, ReservationDto[]> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsByStatusQuery): Promise<ReservationDto[]> {
    return this.reservationService.getReservationsByStatus(query.status);
  }
}
