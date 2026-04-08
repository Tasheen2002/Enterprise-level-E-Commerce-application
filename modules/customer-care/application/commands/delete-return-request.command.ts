import { ReturnRequestService } from "../services/return-request.service.js";

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

export interface DeleteReturnRequestCommand extends ICommand {
  rmaId: string;
}

export class DeleteReturnRequestHandler
  implements ICommandHandler<DeleteReturnRequestCommand, CommandResult<void>>
{
  constructor(private readonly returnService: ReturnRequestService) {}

  async handle(
    command: DeleteReturnRequestCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      await this.returnService.deleteReturnRequest(command.rmaId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete return request", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting return request"
      );
    }
  }
}
