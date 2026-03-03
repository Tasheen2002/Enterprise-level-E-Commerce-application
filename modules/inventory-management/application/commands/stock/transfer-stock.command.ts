import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";


export interface TransferStockCommand extends ICommand {
  variantId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface TransferStockResult {
  fromStock: Stock;
  toStock: Stock;
}

export class TransferStockHandler implements ICommandHandler<
  TransferStockCommand,
  CommandResult<TransferStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    command: TransferStockCommand,
  ): Promise<CommandResult<TransferStockResult>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (
        !command.fromLocationId ||
        command.fromLocationId.trim().length === 0
      ) {
        errors.push("fromLocationId: From location ID is required");
      }

      if (!command.toLocationId || command.toLocationId.trim().length === 0) {
        errors.push("toLocationId: To location ID is required");
      }

      if (command.fromLocationId === command.toLocationId) {
        errors.push(
          "locations: From location and to location cannot be the same",
        );
      }

      if (!command.quantity || command.quantity <= 0) {
        errors.push("quantity: Quantity must be greater than 0");
      }

      if (errors.length > 0) {
        return CommandResult.failure<TransferStockResult>(
          "Validation failed",
          errors,
        );
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

