import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetLowStockItemsQuery extends IQuery {}

export class GetLowStockItemsHandler implements IQueryHandler<
  GetLowStockItemsQuery,
  QueryResult<StockResult[]>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(_query: GetLowStockItemsQuery): Promise<QueryResult<StockResult[]>> {
    const stocks = await this.stockService.getLowStockItems();
    return QueryResult.success(stocks);
  }
}
