import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockManagementService } from "../services/stock-management.service";

export interface GetTotalAvailableStockQuery extends IQuery {
  readonly variantId: string;
}

export interface TotalAvailableStockResult {
  readonly variantId: string;
  readonly totalAvailable: number;
}

export class GetTotalAvailableStockHandler implements IQueryHandler<
  GetTotalAvailableStockQuery,
  TotalAvailableStockResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTotalAvailableStockQuery): Promise<TotalAvailableStockResult> {
    const totalAvailable = await this.stockService.getTotalAvailableStock(query.variantId);
    return { variantId: query.variantId, totalAvailable };
  }
}
