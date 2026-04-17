import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface GetReservationByVariantQuery extends IQuery {
  readonly cartId: string;
  readonly variantId: string;
}

export class GetReservationByVariantHandler implements IQueryHandler<GetReservationByVariantQuery, ReservationDto | null> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservationByVariantQuery): Promise<ReservationDto | null> {
    const reservations = await this.reservationService.getCartReservations(query.cartId);
    const reservation = reservations.find((r) => r.variantId === query.variantId);
    return reservation ?? null;
  }
}
