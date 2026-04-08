import { IQuery } from "@/api/src/shared/application";

export interface GetCartQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}
