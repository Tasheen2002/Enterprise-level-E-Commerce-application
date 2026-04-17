import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService } from "../services/reservation.service";

export interface GetReservedQuantityQuery extends IQuery {
  readonly variantId: string;
  readonly activeOnly: boolean;
}

export interface ReservedQuantityDto {
  readonly variantId: string;
  readonly quantity: number;
}

export class GetReservedQuantityHandler implements IQueryHandler<GetReservedQuantityQuery, ReservedQuantityDto> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservedQuantityQuery): Promise<ReservedQuantityDto> {
    const quantity = query.activeOnly
      ? await this.reservationService.getActiveReservedQuantity(query.variantId)
      : await this.reservationService.getTotalReservedQuantity(query.variantId);
    return { variantId: query.variantId, quantity };
  }
}
