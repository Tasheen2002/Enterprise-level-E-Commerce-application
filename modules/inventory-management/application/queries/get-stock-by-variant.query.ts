import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockResult } from "./get-stock.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockByVariantQuery extends IQuery {
  readonly variantId: string;
}

export class GetStockByVariantHandler implements IQueryHandler<
  GetStockByVariantQuery,
  StockResult[]
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockByVariantQuery): Promise<StockResult[]> {
    return this.stockService.getStockByVariant(query.variantId);
  }
}
