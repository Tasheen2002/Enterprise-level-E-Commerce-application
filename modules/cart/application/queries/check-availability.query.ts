import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, AvailabilityDto } from "../services/reservation.service";

export interface CheckAvailabilityQuery extends IQuery {
  readonly variantId: string;
  readonly requestedQuantity: number;
}

export class CheckAvailabilityHandler implements IQueryHandler<CheckAvailabilityQuery, AvailabilityDto> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(query: CheckAvailabilityQuery): Promise<AvailabilityDto> {
    return this.reservationService.checkAvailability(
      query.variantId,
      query.requestedQuantity,
    );
  }
}
