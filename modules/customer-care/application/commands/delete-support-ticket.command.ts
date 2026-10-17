import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";

export interface DeleteSupportTicketCommand extends ICommand {
  ticketId: string;
}

export class DeleteSupportTicketHandler
  implements ICommandHandler<DeleteSupportTicketCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: DeleteSupportTicketCommand): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", ["ticketId"]);
      }

      await this.ticketService.deleteTicket(command.ticketId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete support ticket", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting support ticket",
      );
    }
  }
}
