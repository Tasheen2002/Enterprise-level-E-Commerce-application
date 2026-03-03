import { IQuery } from "@/api/src/shared/application";
import { TransactionResult } from "./get-transaction.query";

export interface ListTransactionsQuery extends IQuery {
  variantId?: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface ListTransactionsResult {
  transactions: TransactionResult[];
  total: number;
}
