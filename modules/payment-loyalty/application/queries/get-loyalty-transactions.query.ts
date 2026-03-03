import { IQuery } from "@/api/src/shared/application";

export interface GetLoyaltyTransactionsQuery extends IQuery {
  accountId?: string;
  orderId?: string;
}
