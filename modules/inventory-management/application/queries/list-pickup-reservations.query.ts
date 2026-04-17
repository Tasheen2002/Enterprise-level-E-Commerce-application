import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PickupReservationResult } from "./get-pickup-reservation.query";
import { PickupReservationService } from "../services/pickup-reservation.service";

export interface ListPickupReservationsQuery extends IQuery {
  readonly orderId?: string;
  readonly locationId?: string;
  readonly activeOnly?: boolean;
}

export class ListPickupReservationsHandler implements IQueryHandler<
  ListPickupReservationsQuery,
  PickupReservationResult[]
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(query: ListPickupReservationsQuery): Promise<PickupReservationResult[]> {
    if (query.orderId) {
      return this.reservationService.getReservationsByOrder(query.orderId);
    } else if (query.locationId) {
      return this.reservationService.getReservationsByLocation(query.locationId);
    } else if (query.activeOnly) {
      return this.reservationService.getActiveReservations();
    } else {
      return this.reservationService.getAllReservations();
    }
  }
}
