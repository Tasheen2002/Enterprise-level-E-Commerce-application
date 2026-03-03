import { IQuery } from "@/api/src/shared/application";

export interface GetBnplTransactionsQuery extends IQuery {
  bnplId?: string;
  intentId?: string;
  orderId?: string;
  userId?: string;
}
