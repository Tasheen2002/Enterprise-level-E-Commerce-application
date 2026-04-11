import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationByVariantQuery extends IQuery {
  cartId: string;
  variantId: string;
}

export class GetReservationByVariantHandler implements IQueryHandler<GetReservationByVariantQuery, QueryResult<ReservationDto | null>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationByVariantQuery): Promise<QueryResult<ReservationDto | null>> {
    const reservations = await this.reservationService.getCartReservations(query.cartId);
    const reservation = reservations.find((r) => r.variantId === query.variantId);
    return QueryResult.success<ReservationDto | null>(reservation ?? null);
  }
}
