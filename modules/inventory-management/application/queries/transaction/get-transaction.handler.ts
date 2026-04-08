import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetTransactionQuery,
  TransactionResult,
} from "./get-transaction.query";
import { StockManagementService } from "../../services/stock-management.service";

export class GetTransactionHandler implements IQueryHandler<
  GetTransactionQuery,
  QueryResult<TransactionResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTransactionQuery,
  ): Promise<QueryResult<TransactionResult>> {
    try {
      const txn = await this.stockService.getTransaction(query.transactionId);

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
