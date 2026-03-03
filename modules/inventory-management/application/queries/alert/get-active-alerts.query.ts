import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";
import { StockAlertResult } from "./get-stock-alert.query";

export interface GetActiveAlertsQuery extends IQuery {}

export class GetActiveAlertsHandler implements IQueryHandler<
  GetActiveAlertsQuery,
  QueryResult<StockAlertResult[]>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    query: GetActiveAlertsQuery,
  ): Promise<QueryResult<StockAlertResult[]>> {
    try {
      const alerts = await this.stockAlertService.getActiveAlerts();

      const results: StockAlertResult[] = alerts.map((alert) => ({
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt() ?? undefined,
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
