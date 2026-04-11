import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../../services/stock-management.service";

export interface ListStocksQuery extends IQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "low_stock" | "out_of_stock" | "in_stock";
  locationId?: string;
  sortBy?: "available" | "onHand" | "location" | "product";
  sortOrder?: "asc" | "desc";
}

export interface ListStocksResult {
  stocks: StockResult[];
  total: number;
}

export class ListStocksHandler implements IQueryHandler<
  ListStocksQuery,
  QueryResult<ListStocksResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: ListStocksQuery): Promise<QueryResult<ListStocksResult>> {
    const result = await this.stockService.listStocks({
      limit: query.limit,
      offset: query.offset,
      search: query.search,
      status: query.status,
      locationId: query.locationId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return QueryResult.success({ stocks: result.stocks, total: result.total });
  }
}
