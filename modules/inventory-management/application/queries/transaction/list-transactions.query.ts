import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../../services/stock-management.service";

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

export class ListTransactionsHandler implements IQueryHandler<
  ListTransactionsQuery,
  QueryResult<ListTransactionsResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListTransactionsQuery): Promise<QueryResult<ListTransactionsResult>> {
    const options = { limit: query.limit, offset: query.offset };

    const result = query.variantId
      ? await this.stockService.getTransactionHistory(query.variantId, query.locationId, options)
      : await this.stockService.listTransactions(options);

    return QueryResult.success({ transactions: result.transactions, total: result.total });
  }
}
