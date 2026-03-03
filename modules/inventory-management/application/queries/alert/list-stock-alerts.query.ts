import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";
import { StockAlertResult } from "./get-stock-alert.query";

export interface ListStockAlertsQuery extends IQuery {
  limit?: number;
  offset?: number;
  includeResolved?: boolean;
}

export interface ListStockAlertsResult {
  alerts: StockAlertResult[];
  total: number;
}

export class ListStockAlertsHandler implements IQueryHandler<
  ListStockAlertsQuery,
  QueryResult<ListStockAlertsResult>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    query: ListStockAlertsQuery,
  ): Promise<QueryResult<ListStockAlertsResult>> {
    try {
      const result = await this.stockAlertService.listStockAlerts({
        limit: query.limit,
        offset: query.offset,
        includeResolved: query.includeResolved,
      });

      const alerts: StockAlertResult[] = result.alerts.map((alert) => ({
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt() ?? undefined,
        isResolved: alert.isResolved(),
      }));

      return QueryResult.success({
        alerts,
        total: result.total,
      });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
