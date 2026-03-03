import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteStockAlertCommand } from "./delete-stock-alert.command";
import { StockAlertService } from "../../services/stock-alert.service";

export class DeleteStockAlertHandler implements ICommandHandler<
  DeleteStockAlertCommand,
  CommandResult<void>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(command: DeleteStockAlertCommand): Promise<CommandResult<void>> {
    try {
      await this.stockAlertService.deleteStockAlert(command.alertId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
