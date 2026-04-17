import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
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

export interface ListStocksResult {
  readonly stocks: StockResult[];
  readonly total: number;
}

export class ListStocksHandler implements IQueryHandler<
  ListStocksQuery,
  ListStocksResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListStocksQuery): Promise<ListStocksResult> {
    const result = await this.stockService.listStocks({
      limit: query.limit,
      offset: query.offset,
      search: query.search,
      status: query.status,
      locationId: query.locationId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { stocks: result.stocks, total: result.total };
  }
}
