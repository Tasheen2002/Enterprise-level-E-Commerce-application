import { IQuery } from "@/api/src/shared/application";

export interface GetReservationByVariantQuery extends IQuery {
  cartId: string;
  variantId: string;
}
