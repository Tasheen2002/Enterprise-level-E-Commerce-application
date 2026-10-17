import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/index.js";

export interface UpdateReturnRequestCommand extends ICommand {
  rmaId: string;
  status?: string;
  reason?: string;
}

export class UpdateReturnRequestHandler
  implements ICommandHandler<UpdateReturnRequestCommand, CommandResult<void>>
{
  constructor(private readonly returnService: ReturnRequestService) {}

  async handle(command: UpdateReturnRequestCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      // Check if at least one field is being updated
      if (!command.status && !command.reason) {
        return CommandResult.failure<void>("At least one field must be provided for update", [
          "status",
          "reason",
        ]);
      }

      await this.returnService.updateReturnRequest(command.rmaId, {
        status: command.status ? RmaStatus.fromString(command.status) : undefined,
        reason: command.reason,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update return request", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating return request",
      );
    }
  }
}
