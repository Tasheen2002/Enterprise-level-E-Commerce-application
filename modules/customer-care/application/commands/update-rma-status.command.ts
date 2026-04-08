import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/rma-status.vo.js";

// Base interfaces
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
        return CommandResult.failure<void>("Failed to update RMA status", [
          error.message,
        ]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while updating RMA status"
      );
    }
  }
}
