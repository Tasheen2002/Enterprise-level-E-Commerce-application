import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  ListTransactionsQuery,
  ListTransactionsResult,
} from "./list-transactions.query";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../../services/stock-management.service";

export class ListTransactionsHandler implements IQueryHandler<
  ListTransactionsQuery,
  QueryResult<ListTransactionsResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: ListTransactionsQuery,
  ): Promise<QueryResult<ListTransactionsResult>> {
    try {
      const options = { limit: query.limit, offset: query.offset };

      let result: { transactions: any[]; total: number };

      if (query.variantId) {
        result = await this.stockService.getTransactionHistory(
          query.variantId,
          query.locationId,
          options,
        );
      } else {
        result = await this.stockService.listTransactions(options);
      }

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
