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

export interface RejectReturnCommand extends ICommand {
  rmaId: string;
}

export class RejectReturnHandler
  implements ICommandHandler<RejectReturnCommand, CommandResult<void>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(command: RejectReturnCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      // Mark the return request as rejected
      await this.returnRequestService.updateReturnRequest(command.rmaId, {
        status: RmaStatus.rejected(),
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to reject return request", [
          error.message,
        ]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while rejecting return request"
      );
    }
  }
}
