import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { StockAlertResult } from "./get-stock-alert.query";
import { StockAlertService } from "../services/stock-alert.service";

export interface ListStockAlertsQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly includeResolved?: boolean;
}

export class ListStockAlertsHandler implements IQueryHandler<
  ListStockAlertsQuery,
  PaginatedResult<StockAlertResult>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(query: ListStockAlertsQuery): Promise<PaginatedResult<StockAlertResult>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.stockAlertService.listStockAlerts({
      limit,
      offset,
      includeResolved: query.includeResolved,
    });
    return {
      items: result.alerts,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.alerts.length < result.total,
    };
  }
}
