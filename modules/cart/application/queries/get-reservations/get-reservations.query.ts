import { IQuery } from "@/api/src/shared/application";

export interface GetReservationsQuery extends IQuery {
  cartId: string;
  activeOnly?: boolean;
}
