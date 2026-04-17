import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetOutOfStockItemsQuery extends IQuery {}

export class GetOutOfStockItemsHandler implements IQueryHandler<
  GetOutOfStockItemsQuery,
  StockResult[]
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(): Promise<StockResult[]> {
    return this.stockService.getOutOfStockItems();
  }
}
