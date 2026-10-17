import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { RepairService } from "../services/repair.service.js";
import { RepairStatus } from "../../domain/value-objects/repair-status.vo.js";

// Base interfaces

export interface UpdateRepairStatusCommand extends ICommand {
  repairId: string;
  status: string;
}

export class UpdateRepairStatusHandler
  implements ICommandHandler<UpdateRepairStatusCommand, CommandResult<void>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(command: UpdateRepairStatusCommand): Promise<CommandResult<void>> {
    try {
      if (!command.repairId) {
        return CommandResult.failure<void>("Repair ID is required", ["repairId"]);
      }
      if (!command.status) {
        return CommandResult.failure<void>("Status is required", ["status"]);
      }

      const status = RepairStatus.fromString(command.status);
      await this.repairService.updateRepair(command.repairId, { status });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update repair status", [error.message]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while updating repair status",
      );
    }
  }
}
