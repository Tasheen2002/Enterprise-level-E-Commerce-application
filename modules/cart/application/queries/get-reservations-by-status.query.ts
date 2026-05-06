import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDTO } from "../services/reservation.service";

export interface GetReservationsByStatusQuery extends IQuery {
  readonly status: "active" | "expiring_soon" | "expired" | "recently_expired";
}

export class GetReservationsByStatusHandler implements IQueryHandler<GetReservationsByStatusQuery, ReservationDTO[]> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsByStatusQuery): Promise<ReservationDTO[]> {
    return this.reservationService.getReservationsByStatus(query.status);
  }
}
