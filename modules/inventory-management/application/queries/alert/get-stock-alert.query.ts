import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";

export interface GetStockAlertQuery extends IQuery {
  alertId: string;
}

export interface StockAlertResult {
  alertId: string;
  variantId: string;
  type: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}

export class GetStockAlertHandler implements IQueryHandler<
  GetStockAlertQuery,
  QueryResult<StockAlertResult | null>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    query: GetStockAlertQuery,
  ): Promise<QueryResult<StockAlertResult | null>> {
    try {
      if (!query.alertId || query.alertId.trim().length === 0) {
        return QueryResult.failure("alertId: Alert ID is required");
      }

      const alert = await this.stockAlertService.getStockAlert(query.alertId);

      if (!alert) {
        return QueryResult.success<StockAlertResult | null>(null);
      }

      const result: StockAlertResult = {
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt() ?? undefined,
        isResolved: alert.isResolved(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
