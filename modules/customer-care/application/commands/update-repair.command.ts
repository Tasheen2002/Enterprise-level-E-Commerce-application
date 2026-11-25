import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { RepairService } from "../services/repair.service.js";
import { RepairStatus } from "../../domain/value-objects/index.js";

export interface UpdateRepairCommand extends ICommand {
  repairId: string;
  notes?: string;
  status?: string;
}

export class UpdateRepairHandler
  implements ICommandHandler<UpdateRepairCommand, CommandResult<void>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(command: UpdateRepairCommand): Promise<CommandResult<void>> {
    try {
      if (!command.repairId) {
        return CommandResult.failure<void>("Repair ID is required", ["repairId"]);
      }

      // Check if at least one field is being updated
      if (!command.notes && !command.status) {
        return CommandResult.failure<void>("At least one field must be provided for update", [
          "notes",
          "status",
        ]);
      }

      await this.repairService.updateRepair(command.repairId, {
        notes: command.notes,
        status: command.status ? RepairStatus.fromString(command.status) : undefined,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update repair", [error.message]);
      }

      return CommandResult.failure<void>("An unexpected error occurred while updating repair");
    }
  }
}
