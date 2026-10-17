import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/index.js";

export interface ApproveReturnCommand extends ICommand {
  rmaId: string;
}

export class ApproveReturnHandler
  implements ICommandHandler<ApproveReturnCommand, CommandResult<void>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(command: ApproveReturnCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      await this.returnRequestService.updateReturnRequest(command.rmaId, {
        status: RmaStatus.approved(),
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to approve return request", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while approving return request",
      );
    }
  }
}
