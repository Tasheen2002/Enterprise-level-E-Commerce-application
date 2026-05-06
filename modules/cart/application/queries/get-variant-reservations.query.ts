import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDTO } from "../services/reservation.service";

export interface GetVariantReservationsQuery extends IQuery {
  readonly variantId: string;
}

export class GetVariantReservationsHandler implements IQueryHandler<GetVariantReservationsQuery, ReservationDTO[]> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetVariantReservationsQuery): Promise<ReservationDTO[]> {
    return this.reservationService.getVariantReservations(query.variantId);
  }
}
