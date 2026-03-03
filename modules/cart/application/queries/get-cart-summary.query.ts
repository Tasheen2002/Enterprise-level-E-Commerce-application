import { IQuery } from "@/api/src/shared/application";

export interface GetCartSummaryQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}
