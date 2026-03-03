import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";


export interface AddStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: string;
}

export class AddStockHandler implements ICommandHandler<
  AddStockCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AddStockCommand): Promise<CommandResult<Stock>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (!command.quantity || command.quantity <= 0) {
        errors.push("quantity: Quantity must be greater than 0");
      }

      if (!command.reason || command.reason.trim().length === 0) {
        errors.push("reason: Reason is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Stock>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

