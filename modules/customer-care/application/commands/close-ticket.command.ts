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

export interface CloseTicketCommand extends ICommand {
  ticketId: string;
}

export class CloseTicketHandler
  implements ICommandHandler<CloseTicketCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: CloseTicketCommand): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", [
          "ticketId",
        ]);
      }

      await this.ticketService.closeTicket(command.ticketId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to close ticket", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while closing ticket"
      );
    }
  }
}
