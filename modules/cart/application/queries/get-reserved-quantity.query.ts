import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService } from "../services/reservation.service";

export interface GetReservedQuantityQuery extends IQuery {
  readonly variantId: string;
  readonly activeOnly: boolean;
}

export interface ReservedQuantityDto {
  readonly variantId: string;
  readonly quantity: number;
}

export class GetReservedQuantityHandler implements IQueryHandler<GetReservedQuantityQuery, QueryResult<ReservedQuantityDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: GetReservedQuantityQuery): Promise<QueryResult<ReservedQuantityDto>> {
    const quantity = query.activeOnly
      ? await this.reservationService.getActiveReservedQuantity(query.variantId)
      : await this.reservationService.getTotalReservedQuantity(query.variantId);
    return QueryResult.success<ReservedQuantityDto>({ variantId: query.variantId, quantity });
  }
}
