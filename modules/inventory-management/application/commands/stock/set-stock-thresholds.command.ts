import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";


export interface SetStockThresholdsCommand extends ICommand {
  variantId: string;
  locationId: string;
  lowStockThreshold?: number;
  safetyStock?: number;
}

export class SetStockThresholdsHandler implements ICommandHandler<
  SetStockThresholdsCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    command: SetStockThresholdsCommand,
  ): Promise<CommandResult<Stock>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (
        command.lowStockThreshold !== undefined &&
        command.lowStockThreshold < 0
      ) {
        errors.push(
          "lowStockThreshold: Low stock threshold cannot be negative",
        );
      }

      if (command.safetyStock !== undefined && command.safetyStock < 0) {
        errors.push("safetyStock: Safety stock cannot be negative");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Stock>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

