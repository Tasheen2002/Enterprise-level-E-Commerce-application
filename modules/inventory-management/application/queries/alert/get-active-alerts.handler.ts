import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetActiveAlertsQuery } from "./get-active-alerts.query";
import { StockAlertResult } from "./get-stock-alert.query";
import { StockAlertService } from "../../services/stock-alert.service";

export class GetActiveAlertsHandler implements IQueryHandler<
  GetActiveAlertsQuery,
  QueryResult<StockAlertResult[]>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    _query: GetActiveAlertsQuery,
  ): Promise<QueryResult<StockAlertResult[]>> {
    try {
      const alerts = await this.stockAlertService.getActiveAlerts();

      const results: StockAlertResult[] = alerts.map((alert) => ({
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt(),
        isResolved: alert.isResolved(),
      }));

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
