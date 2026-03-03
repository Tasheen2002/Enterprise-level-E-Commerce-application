import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder } from "../../domain/entities/backorder.entity";

export interface UpdateBackorderEtaCommand extends ICommand {
  orderItemId: string;
  promisedEta: Date;
}

export class UpdateBackorderEtaCommandHandler implements ICommandHandler<
  UpdateBackorderEtaCommand,
  CommandResult<Backorder>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: UpdateBackorderEtaCommand,
  ): Promise<CommandResult<Backorder>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderItemId || command.orderItemId.trim().length === 0) {
        errors.push("orderItemId: Order item ID is required");
      }

      if (!command.promisedEta) {
        errors.push("promisedEta: Promised ETA is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Backorder>("Validation failed", errors);
      }

      // Execute service
      const backorder = await this.backorderService.updatePromisedEta(
        command.orderItemId,
        command.promisedEta,
      );

      if (!backorder) {
        return CommandResult.failure<Backorder>("Backorder not found");
      }

      return CommandResult.success(backorder);
    } catch (error) {
      return CommandResult.failure<Backorder>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { UpdateBackorderEtaCommandHandler as UpdateBackorderEtaHandler };
