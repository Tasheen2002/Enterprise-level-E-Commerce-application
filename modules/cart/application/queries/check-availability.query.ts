import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, AvailabilityDto } from "../services/reservation.service";

export interface CheckAvailabilityQuery extends IQuery {
  variantId: string;
  requestedQuantity: number;
}

export class CheckAvailabilityHandler implements IQueryHandler<CheckAvailabilityQuery, QueryResult<AvailabilityDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: CheckAvailabilityQuery): Promise<QueryResult<AvailabilityDto>> {
    const availability = await this.reservationService.checkAvailability(
      query.variantId,
      query.requestedQuantity,
    );
    return QueryResult.success<AvailabilityDto>(availability);
  }
}
