import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

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

export class GetTransactionHandler implements IQueryHandler<
  GetTransactionQuery,
  QueryResult<TransactionResult | null>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTransactionQuery,
  ): Promise<QueryResult<TransactionResult | null>> {
    try {
      if (!query.transactionId || query.transactionId.trim().length === 0) {
        return QueryResult.failure("transactionId: Transaction ID is required");
      }

      const txn = await this.stockService.getTransaction(query.transactionId);

      if (!txn) {
        return QueryResult.success<TransactionResult | null>(null);
      }

      const result: TransactionResult = {
        invTxnId: txn.getInvTxnId().getValue(),
        variantId: txn.getVariantId(),
        locationId: txn.getLocationId(),
        qtyDelta: txn.getQtyDelta(),
        reason: txn.getReason().getValue(),
        referenceId: txn.getReferenceId() ?? undefined,
        createdAt: txn.getCreatedAt(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
