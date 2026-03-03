import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ResolveStockAlertCommand } from "./resolve-stock-alert.command";
import { StockAlertService } from "../../services/stock-alert.service";
import { StockAlert } from "../../../domain/entities/stock-alert.entity";

export class ResolveStockAlertHandler implements ICommandHandler<
  ResolveStockAlertCommand,
  CommandResult<StockAlert>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    command: ResolveStockAlertCommand,
  ): Promise<CommandResult<StockAlert>> {
    try {
      const alert = await this.stockAlertService.resolveStockAlert(
        command.alertId,
      );

      return CommandResult.success(alert);
    } catch (error) {
      return CommandResult.failure<StockAlert>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
