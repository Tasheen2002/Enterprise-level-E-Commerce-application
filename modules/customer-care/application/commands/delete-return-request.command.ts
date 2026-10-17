import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";

export interface DeleteReturnRequestCommand extends ICommand {
  rmaId: string;
}

export class DeleteReturnRequestHandler
  implements ICommandHandler<DeleteReturnRequestCommand, CommandResult<void>>
{
  constructor(private readonly returnService: ReturnRequestService) {}

  async handle(command: DeleteReturnRequestCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      await this.returnService.deleteReturnRequest(command.rmaId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete return request", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting return request",
      );
    }
  }
}
