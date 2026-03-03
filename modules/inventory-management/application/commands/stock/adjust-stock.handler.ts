import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";
import { AdjustStockCommand } from "./adjust-stock.command";

export class AdjustStockHandler implements ICommandHandler<
  AdjustStockCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AdjustStockCommand): Promise<CommandResult<Stock>> {
    try {
      const stock = await this.stockService.adjustStock(
        command.variantId,
        command.locationId,
        command.quantityDelta,
        command.reason,
      );

      return CommandResult.success(stock);
    } catch (error) {
      return CommandResult.failure<Stock>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
