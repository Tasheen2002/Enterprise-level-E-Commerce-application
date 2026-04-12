import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../services/stock-management.service";

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

export class GetTransactionsByVariantHandler implements IQueryHandler<
  GetTransactionsByVariantQuery,
  QueryResult<TransactionsByVariantResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionsByVariantQuery): Promise<QueryResult<TransactionsByVariantResult>> {
    const result = await this.stockService.getTransactionHistory(
      query.variantId,
      query.locationId,
      { limit: query.limit, offset: query.offset },
    );
    return QueryResult.success({ transactions: result.transactions, total: result.total });
  }
}
