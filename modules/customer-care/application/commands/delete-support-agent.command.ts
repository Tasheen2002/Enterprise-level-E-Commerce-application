import { SupportAgentService } from "../services/support-agent.service.js";

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

export interface DeleteSupportAgentCommand extends ICommand {
  agentId: string;
}

export class DeleteSupportAgentHandler
  implements ICommandHandler<DeleteSupportAgentCommand, CommandResult<void>>
{
  constructor(private readonly agentService: SupportAgentService) {}

  async handle(
    command: DeleteSupportAgentCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.agentId) {
        return CommandResult.failure<void>("Agent ID is required", ["agentId"]);
      }

      await this.agentService.deleteAgent(command.agentId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete support agent", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting support agent"
      );
    }
  }
}
