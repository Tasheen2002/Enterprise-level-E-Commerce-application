import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDTO } from "../services/reservation.service";
import { ReservationNotFoundError } from "../../domain/errors";

export interface GetReservationQuery extends IQuery {
  readonly reservationId: string;
}

export class GetReservationHandler implements IQueryHandler<GetReservationQuery, ReservationDTO> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationQuery): Promise<ReservationDTO> {
    const reservation = await this.reservationService.getReservation(query.reservationId);
    if (reservation === null) throw new ReservationNotFoundError(query.reservationId);
    return reservation;
  }
}
