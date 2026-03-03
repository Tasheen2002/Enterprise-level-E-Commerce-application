import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateStockAlertCommand } from "./create-stock-alert.command";
import { StockAlertService } from "../../services/stock-alert.service";
import { StockAlert } from "../../../domain/entities/stock-alert.entity";

export class CreateStockAlertHandler implements ICommandHandler<
  CreateStockAlertCommand,
  CommandResult<StockAlert>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    command: CreateStockAlertCommand,
  ): Promise<CommandResult<StockAlert>> {
    try {
      const alert = await this.stockAlertService.createStockAlert(
        command.variantId,
        command.type,
      );

      return CommandResult.success(alert);
    } catch (error) {
      return CommandResult.failure<StockAlert>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
