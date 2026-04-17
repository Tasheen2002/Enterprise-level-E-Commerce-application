import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetLowStockItemsQuery extends IQuery {}

export class GetLowStockItemsHandler implements IQueryHandler<
  GetLowStockItemsQuery,
  StockResult[]
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(): Promise<StockResult[]> {
    return this.stockService.getLowStockItems();
  }
}
