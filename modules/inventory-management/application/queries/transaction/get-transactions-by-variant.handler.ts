import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetTransactionsByVariantQuery,
  TransactionsByVariantResult,
} from "./get-transactions-by-variant.query";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../../services/stock-management.service";

export class GetTransactionsByVariantHandler implements IQueryHandler<
  GetTransactionsByVariantQuery,
  QueryResult<TransactionsByVariantResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTransactionsByVariantQuery,
  ): Promise<QueryResult<TransactionsByVariantResult>> {
    try {
      const result = await this.stockService.getTransactionHistory(
        query.variantId,
        query.locationId,
        { limit: query.limit, offset: query.offset },
      );

      const transactions: TransactionResult[] = result.transactions.map(
        (txn) => ({
          invTxnId: txn.getInvTxnId().getValue(),
          variantId: txn.getVariantId(),
          locationId: txn.getLocationId(),
          qtyDelta: txn.getQtyDelta(),
          reason: txn.getReason().getValue(),
          referenceId: txn.getReferenceId() ?? undefined,
          createdAt: txn.getCreatedAt(),
        }),
      );

      return QueryResult.success({ transactions, total: result.total });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
