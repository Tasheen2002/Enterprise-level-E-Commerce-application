import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface ListStocksQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly search?: string;
  readonly status?: "low_stock" | "out_of_stock" | "in_stock";
  readonly locationId?: string;
  readonly sortBy?: "available" | "onHand" | "location" | "product";
  readonly sortOrder?: "asc" | "desc";
}

export class ListStocksHandler implements IQueryHandler<
  ListStocksQuery,
  PaginatedResult<StockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListStocksQuery): Promise<PaginatedResult<StockResult>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.stockService.listStocks({
      limit,
      offset,
      search: query.search,
      status: query.status,
      locationId: query.locationId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      items: result.stocks,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.stocks.length < result.total,
    };
  }
}
