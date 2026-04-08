import { IQuery } from "@/api/src/shared/application";

export interface GetPaymentTransactionsQuery extends IQuery {
  intentId: string;
  userId?: string;
}
