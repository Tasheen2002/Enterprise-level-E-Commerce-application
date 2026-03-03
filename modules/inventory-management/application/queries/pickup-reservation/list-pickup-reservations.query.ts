import { IQuery } from "@/api/src/shared/application";

export interface ListPickupReservationsQuery extends IQuery {
  orderId?: string;
  locationId?: string;
  activeOnly?: boolean;
}
