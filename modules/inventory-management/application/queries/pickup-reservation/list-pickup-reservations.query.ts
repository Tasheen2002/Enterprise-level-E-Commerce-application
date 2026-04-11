import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PickupReservationResult } from "./get-pickup-reservation.query";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface ListPickupReservationsQuery extends IQuery {
  orderId?: string;
  locationId?: string;
  activeOnly?: boolean;
}

export class ListPickupReservationsHandler implements IQueryHandler<
  ListPickupReservationsQuery,
  QueryResult<PickupReservationResult[]>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(query: ListPickupReservationsQuery): Promise<QueryResult<PickupReservationResult[]>> {
    let reservations: PickupReservationResult[];

    if (query.orderId) {
      reservations = await this.reservationService.getReservationsByOrder(query.orderId);
    } else if (query.locationId) {
      reservations = await this.reservationService.getReservationsByLocation(query.locationId);
    } else if (query.activeOnly) {
      reservations = await this.reservationService.getActiveReservations();
    } else {
      reservations = await this.reservationService.getAllReservations();
    }

    return QueryResult.success(reservations);
  }
}
