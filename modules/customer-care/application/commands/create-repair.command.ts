import { RepairService } from "../services/repair.service.js";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "./add-return-item.command.js";

export interface CreateRepairCommand extends ICommand {
  orderItemId: string;
  notes?: string;
}

export interface RepairResult {
  repairId: string;
  orderItemId: string;
  notes?: string;
  status: string;
}

export class CreateRepairHandler
  implements ICommandHandler<CreateRepairCommand, CommandResult<RepairResult>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(
    command: CreateRepairCommand
  ): Promise<CommandResult<RepairResult>> {
    try {
      if (!command.orderItemId) {
        return CommandResult.failure<RepairResult>(
          "Order Item ID is required",
          ["orderItemId"]
        );
      }

      const repair = await this.repairService.createRepair({
        orderItemId: command.orderItemId,
        notes: command.notes,
      });

      const result: RepairResult = {
        repairId: repair.getRepairId().getValue(),
        orderItemId: repair.getOrderItemId(),
        notes: repair.getNotes(),
        status: repair.getStatus()?.getValue() ?? "",
      };

      return CommandResult.success<RepairResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<RepairResult>("Failed to create repair", [
          error.message,
        ]);
      }
      return CommandResult.failure<RepairResult>(
        "An unexpected error occurred while creating repair"
      );
    }
  }
}
