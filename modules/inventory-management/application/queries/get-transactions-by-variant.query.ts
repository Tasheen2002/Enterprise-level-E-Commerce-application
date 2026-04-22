import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { InventoryTransactionDTO } from "../../domain/entities/inventory-transaction.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface GetTransactionsByVariantQuery extends IQuery {
  readonly variantId: string;
  readonly locationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetTransactionsByVariantHandler implements IQueryHandler<
  GetTransactionsByVariantQuery,
  PaginatedResult<InventoryTransactionDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionsByVariantQuery): Promise<PaginatedResult<InventoryTransactionDTO>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.stockService.getTransactionHistory(
      query.variantId,
      query.locationId,
      { limit, offset },
    );
    return {
      items: result.transactions,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.transactions.length < result.total,
    };
  }
}
