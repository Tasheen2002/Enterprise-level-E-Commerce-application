import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";
import { AddStockCommand } from "./add-stock.command";

export class AddStockHandler implements ICommandHandler<
  AddStockCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AddStockCommand): Promise<CommandResult<Stock>> {
    try {
      const stock = await this.stockService.addStock(
        command.variantId,
        command.locationId,
        command.quantity,
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
