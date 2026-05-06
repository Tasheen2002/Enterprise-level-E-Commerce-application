import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDTO } from "../services/reservation.service";

export interface GetReservationsQuery extends IQuery {
  readonly cartId: string;
  readonly activeOnly?: boolean;
}

export class GetReservationsHandler implements IQueryHandler<GetReservationsQuery, ReservationDTO[]> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationsQuery): Promise<ReservationDTO[]> {
    const activeOnly = query.activeOnly !== false;
    return activeOnly
      ? this.reservationService.getActiveCartReservations(query.cartId)
      : this.reservationService.getCartReservations(query.cartId);
  }
}
