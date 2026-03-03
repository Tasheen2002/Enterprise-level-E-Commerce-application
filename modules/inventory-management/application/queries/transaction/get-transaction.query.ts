import { IQuery } from "@/api/src/shared/application";

export interface GetTransactionQuery extends IQuery {
  transactionId: string;
}

export interface TransactionResult {
  invTxnId: string;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}
