import { IQuery } from "@/api/src/shared/application";
import { TransactionResult } from "./get-transaction.query";

export interface GetTransactionHistoryQuery extends IQuery {
  variantId: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface GetTransactionHistoryResult {
  transactions: TransactionResult[];
  total: number;
}
