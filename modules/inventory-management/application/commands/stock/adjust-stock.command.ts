import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";


export interface AdjustStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
}

export class AdjustStockHandler implements ICommandHandler<
  AdjustStockCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AdjustStockCommand): Promise<CommandResult<Stock>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (
        command.quantityDelta === undefined ||
        command.quantityDelta === null
      ) {
        errors.push("quantityDelta: Quantity delta is required");
      }

      if (command.quantityDelta === 0) {
        errors.push("quantityDelta: Quantity delta cannot be zero");
      }

      if (!command.reason || command.reason.trim().length === 0) {
        errors.push("reason: Reason is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Stock>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

