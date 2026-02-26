import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
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

export class GetStockAlertQueryHandler implements IQueryHandler<
  GetStockAlertQuery,
  CommandResult<StockAlertResult | null>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    query: GetStockAlertQuery,
  ): Promise<CommandResult<StockAlertResult | null>> {
    try {
      const errors: string[] = [];

      if (!query.alertId || query.alertId.trim().length === 0) {
        errors.push("alertId: Alert ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<StockAlertResult | null>(
          "Validation failed",
          errors,
        );
      }

      const alert = await this.stockAlertService.getStockAlert(query.alertId);

      if (!alert) {
        return CommandResult.success<StockAlertResult | null>(null);
      }

      const result: StockAlertResult = {
        alertId: alert.getAlertId().getValue(),
        variantId: alert.getVariantId(),
        type: alert.getType().getValue(),
        triggeredAt: alert.getTriggeredAt(),
        resolvedAt: alert.getResolvedAt() ?? undefined,
        isResolved: alert.isResolved(),
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<StockAlertResult | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetStockAlertQueryHandler as GetStockAlertHandler };
