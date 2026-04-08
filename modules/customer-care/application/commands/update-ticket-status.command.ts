import { SupportTicketService } from "../services/support-ticket.service.js";
import { TicketStatus } from "../../domain/value-objects/index.js";

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

export interface UpdateTicketStatusCommand extends ICommand {
  ticketId: string;
  status: string;
}

export class UpdateTicketStatusHandler
  implements ICommandHandler<UpdateTicketStatusCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(
    command: UpdateTicketStatusCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", [
          "ticketId",
        ]);
      }

      if (!command.status) {
        return CommandResult.failure<void>("Status is required", ["status"]);
      }

      await this.ticketService.updateTicketStatus(
        command.ticketId,
        TicketStatus.fromString(command.status)
      );

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update ticket status", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating ticket status"
      );
    }
  }
}
