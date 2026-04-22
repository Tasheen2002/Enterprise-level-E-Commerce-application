import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { InventoryTransactionDTO } from "../../domain/entities/inventory-transaction.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface ListTransactionsQuery extends IQuery {
  readonly variantId?: string;
  readonly locationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class ListTransactionsHandler implements IQueryHandler<
  ListTransactionsQuery,
  PaginatedResult<InventoryTransactionDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListTransactionsQuery): Promise<PaginatedResult<InventoryTransactionDTO>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const options = { limit, offset };

    const result = query.variantId
      ? await this.stockService.getTransactionHistory(query.variantId, query.locationId, options)
      : await this.stockService.listTransactions(options);

    return {
      items: result.transactions,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.transactions.length < result.total,
    };
  }
}
