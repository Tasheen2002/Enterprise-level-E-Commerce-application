import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetStockAlertQuery, StockAlertResult } from "./get-stock-alert.query";
import { StockAlertService } from "../../services/stock-alert.service";

export class GetStockAlertHandler implements IQueryHandler<
  GetStockAlertQuery,
  QueryResult<StockAlertResult>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    query: GetStockAlertQuery,
  ): Promise<QueryResult<StockAlertResult>> {
    try {
      const alert = await this.stockAlertService.getStockAlert(query.alertId);

      const result: StockAlertResult = {
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt(),
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
