import { SupportAgentService } from "../services/support-agent.service.js";

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

export interface UpdateSupportAgentCommand extends ICommand {
  agentId: string;
  name?: string;
  roster?: string[];
  skills?: string[];
}

export class UpdateSupportAgentHandler
  implements ICommandHandler<UpdateSupportAgentCommand, CommandResult<void>>
{
  constructor(private readonly supportAgentService: SupportAgentService) {}

  async handle(
    command: UpdateSupportAgentCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.agentId) {
        return CommandResult.failure<void>("Agent ID is required", ["agentId"]);
      }
      if (!command.name && !command.roster && !command.skills) {
        return CommandResult.failure<void>(
          "At least one of name, roster, or skills must be provided",
          ["name", "roster", "skills"]
        );
      }

      await this.supportAgentService.updateAgent(command.agentId, {
        name: command.name,
        roster: command.roster,
        skills: command.skills,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update support agent", [
          error.message,
        ]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while updating support agent"
      );
    }
  }
}
