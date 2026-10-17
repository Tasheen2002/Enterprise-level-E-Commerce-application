import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";
import { TicketStatus, TicketPriority } from "../../domain/value-objects/index.js";

export interface UpdateSupportTicketCommand extends ICommand {
  ticketId: string;
  subject?: string;
  status?: string;
  priority?: string;
}

export class UpdateSupportTicketHandler
  implements ICommandHandler<UpdateSupportTicketCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: UpdateSupportTicketCommand): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", ["ticketId"]);
      }

      // Check if at least one field is being updated
      if (!command.subject && !command.status && !command.priority) {
        return CommandResult.failure<void>("At least one field must be provided for update", [
          "subject",
          "status",
          "priority",
        ]);
      }

      // Update subject if provided
      if (command.subject) {
        await this.ticketService.updateTicketSubject(command.ticketId, command.subject);
      }

      // Update status if provided
      if (command.status) {
        await this.ticketService.updateTicketStatus(
          command.ticketId,
          TicketStatus.fromString(command.status),
        );
      }

      // Update priority if provided
      if (command.priority) {
        await this.ticketService.updateTicketPriority(
          command.ticketId,
          TicketPriority.fromString(command.priority),
        );
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update support ticket", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating support ticket",
      );
    }
  }
}
