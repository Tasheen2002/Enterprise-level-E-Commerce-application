import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationQuery extends IQuery {
  readonly reservationId: string;
}

export class GetReservationHandler implements IQueryHandler<GetReservationQuery, ReservationDto | null> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationQuery): Promise<ReservationDto | null> {
    return this.reservationService.getReservation(query.reservationId);
  }
}
