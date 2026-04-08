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
        return CommandResult.failure<void>("Failed to approve return request", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while approving return request"
      );
    }
  }
}
