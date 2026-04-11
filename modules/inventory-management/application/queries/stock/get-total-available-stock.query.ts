import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTotalAvailableStockQuery extends IQuery {
  variantId: string;
}

export interface TotalAvailableStockResult {
  variantId: string;
  totalAvailable: number;
}

export class GetTotalAvailableStockHandler implements IQueryHandler<
  GetTotalAvailableStockQuery,
  QueryResult<TotalAvailableStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTotalAvailableStockQuery): Promise<QueryResult<TotalAvailableStockResult>> {
    const totalAvailable = await this.stockService.getTotalAvailableStock(query.variantId);
    return QueryResult.success({ variantId: query.variantId, totalAvailable });
  }
}
