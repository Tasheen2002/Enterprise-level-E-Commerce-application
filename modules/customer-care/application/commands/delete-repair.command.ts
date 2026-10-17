import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { RepairService } from "../services/repair.service.js";

export interface DeleteRepairCommand extends ICommand {
  repairId: string;
}

export class DeleteRepairHandler
  implements ICommandHandler<DeleteRepairCommand, CommandResult<void>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(command: DeleteRepairCommand): Promise<CommandResult<void>> {
    try {
      if (!command.repairId) {
        return CommandResult.failure<void>("Repair ID is required", ["repairId"]);
      }

      await this.repairService.deleteRepair(command.repairId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete repair", [error.message]);
      }

      return CommandResult.failure<void>("An unexpected error occurred while deleting repair");
    }
  }
}
