import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";
import { SetStockThresholdsCommand } from "./set-stock-thresholds.command";

export class SetStockThresholdsHandler implements ICommandHandler<
  SetStockThresholdsCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    command: SetStockThresholdsCommand,
  ): Promise<CommandResult<Stock>> {
    try {
      const stock = await this.stockService.setStockThresholds(
        command.variantId,
        command.locationId,
        command.lowStockThreshold,
        command.safetyStock,
      );

      return CommandResult.success(stock);
    } catch (error) {
      return CommandResult.failure<Stock>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
