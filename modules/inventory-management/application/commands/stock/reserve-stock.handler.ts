import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";
import { ReserveStockCommand } from "./reserve-stock.command";

export class ReserveStockHandler implements ICommandHandler<
  ReserveStockCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: ReserveStockCommand): Promise<CommandResult<Stock>> {
    try {
      const stock = await this.stockService.reserveStock(
        command.variantId,
        command.locationId,
        command.quantity,
      );

      return CommandResult.success(stock);
    } catch (error) {
      return CommandResult.failure<Stock>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
