import { SupportTicketService } from "../services/support-ticket.service.js";

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

export interface AssignSupportAgentCommand extends ICommand {
  ticketId: string;
  agentId: string;
}

export class AssignSupportAgentHandler
  implements ICommandHandler<AssignSupportAgentCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(
    command: AssignSupportAgentCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", [
          "ticketId",
        ]);
      }
      if (!command.agentId) {
        return CommandResult.failure<void>("Agent ID is required", ["agentId"]);
      }
      // This assumes you have a method to assign an agent in your service/entity
      // If not, you should implement it accordingly
      // Example:
      // await this.ticketService.assignAgent(command.ticketId, command.agentId);
      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to assign support agent", [
          error.message,
        ]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while assigning support agent"
      );
    }
  }
}
