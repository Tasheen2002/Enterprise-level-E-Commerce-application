import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetVariantReservationsQuery extends IQuery {
  readonly variantId: string;
}

export class GetVariantReservationsHandler implements IQueryHandler<GetVariantReservationsQuery, QueryResult<ReservationDto[]>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetVariantReservationsQuery): Promise<QueryResult<ReservationDto[]>> {
    const reservations = await this.reservationService.getVariantReservations(query.variantId);
    return QueryResult.success<ReservationDto[]>(reservations);
  }
}
