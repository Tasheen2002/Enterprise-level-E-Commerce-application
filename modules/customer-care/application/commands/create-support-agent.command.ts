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

export interface CreateSupportAgentCommand extends ICommand {
  name: string;
  roster?: string[];
  skills?: string[];
}

export interface SupportAgentResult {
  agentId: string;
  name: string;
  roster: string[];
  skills: string[];
}

export class CreateSupportAgentHandler
  implements
    ICommandHandler<
      CreateSupportAgentCommand,
      CommandResult<SupportAgentResult>
    >
{
  constructor(private readonly supportAgentService: SupportAgentService) {}

  async handle(
    command: CreateSupportAgentCommand
  ): Promise<CommandResult<SupportAgentResult>> {
    try {
      if (!command.name) {
        return CommandResult.failure<SupportAgentResult>("Name is required", [
          "name",
        ]);
      }

      const agent = await this.supportAgentService.createAgent({
        name: command.name,
        roster: command.roster,
        skills: command.skills,
      });

      const result: SupportAgentResult = {
        agentId: agent.getAgentId().getValue(),
        name: agent.getName(),
        roster: agent.getRoster(),
        skills: agent.getSkills(),
      };

      return CommandResult.success<SupportAgentResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<SupportAgentResult>(
          "Failed to create support agent",
          [error.message]
        );
      }
      return CommandResult.failure<SupportAgentResult>(
        "An unexpected error occurred while creating support agent"
      );
    }
  }
}
