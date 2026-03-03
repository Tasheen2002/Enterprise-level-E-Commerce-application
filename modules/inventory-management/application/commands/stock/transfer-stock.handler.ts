import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import {
  TransferStockCommand,
  TransferStockResult,
} from "./transfer-stock.command";

export class TransferStockHandler implements ICommandHandler<
  TransferStockCommand,
  CommandResult<TransferStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    command: TransferStockCommand,
  ): Promise<CommandResult<TransferStockResult>> {
    try {
      const result = await this.stockService.transferStock(
        command.variantId,
        command.fromLocationId,
        command.toLocationId,
        command.quantity,
      );

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<TransferStockResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
