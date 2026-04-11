import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PickupReservationDTO } from "../../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface GetPickupReservationQuery extends IQuery {
  reservationId: string;
}

export type PickupReservationResult = PickupReservationDTO;

export class GetPickupReservationHandler implements IQueryHandler<
  GetPickupReservationQuery,
  QueryResult<PickupReservationResult>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(query: GetPickupReservationQuery): Promise<QueryResult<PickupReservationResult>> {
    const reservation = await this.reservationService.getPickupReservation(query.reservationId);
    return QueryResult.success(reservation);
  }
}
