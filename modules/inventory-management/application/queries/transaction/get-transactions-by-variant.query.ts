import { IQuery } from "@/api/src/shared/application";
import { TransactionResult } from "./get-transaction.query";

export interface GetTransactionsByVariantQuery extends IQuery {
  variantId: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionsByVariantResult {
  transactions: TransactionResult[];
  total: number;
}
