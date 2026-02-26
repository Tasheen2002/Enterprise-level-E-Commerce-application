import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
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

export class GetTransactionHistoryHandler implements IQueryHandler<
  GetTransactionHistoryQuery,
  QueryResult<GetTransactionHistoryResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTransactionHistoryQuery,
  ): Promise<QueryResult<GetTransactionHistoryResult>> {
    try {
      if (!query.variantId || query.variantId.trim().length === 0) {
        return QueryResult.failure("variantId: Variant ID is required");
      }

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
