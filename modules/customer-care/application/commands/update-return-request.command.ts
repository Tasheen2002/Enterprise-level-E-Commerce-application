import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/index.js";

export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface UpdateReturnRequestCommand extends ICommand {
  rmaId: string;
  status?: string;
  reason?: string;
}

export class UpdateReturnRequestHandler
  implements ICommandHandler<UpdateReturnRequestCommand, CommandResult<void>>
{
  constructor(private readonly returnService: ReturnRequestService) {}

  async handle(
    command: UpdateReturnRequestCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      // Check if at least one field is being updated
      if (!command.status && !command.reason) {
        return CommandResult.failure<void>(
          "At least one field must be provided for update",
          ["status", "reason"]
        );
      }

      await this.returnService.updateReturnRequest(command.rmaId, {
        status: command.status
          ? RmaStatus.fromString(command.status)
          : undefined,
        reason: command.reason,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update return request", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating return request"
      );
    }
  }
}
