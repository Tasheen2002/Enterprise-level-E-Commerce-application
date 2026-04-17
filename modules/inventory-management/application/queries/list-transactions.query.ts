import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../services/stock-management.service";

export interface ListTransactionsQuery extends IQuery {
  readonly variantId?: string;
  readonly locationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListTransactionsResult {
  readonly transactions: TransactionResult[];
  readonly total: number;
}

export class ListTransactionsHandler implements IQueryHandler<
  ListTransactionsQuery,
  ListTransactionsResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListTransactionsQuery): Promise<ListTransactionsResult> {
    const options = { limit: query.limit, offset: query.offset };

    const result = query.variantId
      ? await this.stockService.getTransactionHistory(query.variantId, query.locationId, options)
      : await this.stockService.listTransactions(options);

    return { transactions: result.transactions, total: result.total };
  }
}
