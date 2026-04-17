import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockQuery extends IQuery {
  readonly variantId: string;
  readonly locationId: string;
}

export type StockResult = StockDTO;

export class GetStockHandler implements IQueryHandler<
  GetStockQuery,
  StockResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockQuery): Promise<StockResult> {
    return this.stockService.getStock(query.variantId, query.locationId);
  }
}
