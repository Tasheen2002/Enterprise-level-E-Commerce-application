import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockQuery extends IQuery {
  variantId: string;
  locationId: string;
}

export type StockResult = StockDTO;

export class GetStockHandler implements IQueryHandler<
  GetStockQuery,
  QueryResult<StockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockQuery): Promise<QueryResult<StockResult>> {
    const stock = await this.stockService.getStock(query.variantId, query.locationId);
    return QueryResult.success(stock);
  }
}
