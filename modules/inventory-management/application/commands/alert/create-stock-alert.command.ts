import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";
import { StockAlert } from "../../../domain/entities/stock-alert.entity";

export interface CreateStockAlertCommand extends ICommand {
  variantId: string;
  type: string;
}

export class CreateStockAlertHandler implements ICommandHandler<
  CreateStockAlertCommand,
  CommandResult<StockAlert>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(
    command: CreateStockAlertCommand,
  ): Promise<CommandResult<StockAlert>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.type || command.type.trim().length === 0) {
        errors.push("type: Alert type is required");
      }

      const validTypes = ["low_stock", "oos", "overstock"];
      if (command.type && !validTypes.includes(command.type.toLowerCase())) {
        errors.push(
          "type: Alert type must be one of: low_stock, oos, overstock",
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<StockAlert>("Validation failed", errors);
      }

      const alert = await this.stockAlertService.createStockAlert(
        command.variantId,
        command.type,
      );

      return CommandResult.success(alert);
    } catch (error) {
      return CommandResult.failure<StockAlert>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

