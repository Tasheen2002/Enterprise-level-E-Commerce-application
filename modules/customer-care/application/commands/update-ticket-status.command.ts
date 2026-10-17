import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";
import { TicketStatus } from "../../domain/value-objects/index.js";

export interface UpdateTicketStatusCommand extends ICommand {
  ticketId: string;
  status: string;
}

export class UpdateTicketStatusHandler
  implements ICommandHandler<UpdateTicketStatusCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: UpdateTicketStatusCommand): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", ["ticketId"]);
      }

      if (!command.status) {
        return CommandResult.failure<void>("Status is required", ["status"]);
      }

      await this.ticketService.updateTicketStatus(
        command.ticketId,
        TicketStatus.fromString(command.status),
      );

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update ticket status", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating ticket status",
      );
    }
  }
}
