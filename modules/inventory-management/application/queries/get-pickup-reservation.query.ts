import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PickupReservationDTO } from "../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../services/pickup-reservation.service";

export interface GetPickupReservationQuery extends IQuery {
  readonly reservationId: string;
}

export type PickupReservationResult = PickupReservationDTO;

export class GetPickupReservationHandler implements IQueryHandler<
  GetPickupReservationQuery,
  PickupReservationResult
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(query: GetPickupReservationQuery): Promise<PickupReservationResult> {
    return this.reservationService.getPickupReservation(query.reservationId);
  }
}
