import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";

export interface DeleteStockAlertCommand extends ICommand {
  alertId: string;
}

export class DeleteStockAlertHandler implements ICommandHandler<
  DeleteStockAlertCommand,
  CommandResult<void>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    command: DeleteStockAlertCommand,
  ): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.alertId || command.alertId.trim().length === 0) {
        errors.push("alertId: Alert ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.stockAlertService.deleteStockAlert(command.alertId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
