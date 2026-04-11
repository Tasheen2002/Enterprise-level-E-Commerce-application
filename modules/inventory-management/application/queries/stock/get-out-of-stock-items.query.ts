import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetOutOfStockItemsQuery extends IQuery {}

export class GetOutOfStockItemsHandler implements IQueryHandler<
  GetOutOfStockItemsQuery,
  QueryResult<StockResult[]>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(_query: GetOutOfStockItemsQuery): Promise<QueryResult<StockResult[]>> {
    const stocks = await this.stockService.getOutOfStockItems();
    return QueryResult.success(stocks);
  }
}
