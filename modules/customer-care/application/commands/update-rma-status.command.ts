import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/rma-status.vo.js";

// Base interfaces

export interface UpdateRmaStatusCommand extends ICommand {
  rmaId: string;
  status: string;
}

export class UpdateRmaStatusHandler
  implements ICommandHandler<UpdateRmaStatusCommand, CommandResult<void>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(command: UpdateRmaStatusCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }
      if (!command.status) {
        return CommandResult.failure<void>("Status is required", ["status"]);
      }

      const status = RmaStatus.fromString(command.status);
      await this.returnRequestService.updateReturnRequest(command.rmaId, {
        status,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update RMA status", [error.message]);
      }
      return CommandResult.failure<void>("An unexpected error occurred while updating RMA status");
    }
  }
}
