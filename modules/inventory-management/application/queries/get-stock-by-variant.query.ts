import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockByVariantQuery extends IQuery {
  variantId: string;
}

export class GetStockByVariantHandler implements IQueryHandler<
  GetStockByVariantQuery,
  QueryResult<StockResult[]>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockByVariantQuery): Promise<QueryResult<StockResult[]>> {
    const stocks = await this.stockService.getStockByVariant(query.variantId);
    return QueryResult.success(stocks);
  }
}
