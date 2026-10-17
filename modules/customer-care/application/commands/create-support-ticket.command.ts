import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";
import { TicketPriority, TicketSource } from "../../domain/value-objects/index.js";

export interface CreateSupportTicketCommand extends ICommand {
  userId?: string;
  orderId?: string;
  source: string;
  subject: string;
  priority?: string;
}

export interface SupportTicketResult {
  ticketId: string;
  userId?: string;
  orderId?: string;
  source: string;
  subject: string;
  status: string;
  priority?: string;
  createdAt: Date;
}

export class CreateSupportTicketHandler
  implements ICommandHandler<CreateSupportTicketCommand, CommandResult<SupportTicketResult>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: CreateSupportTicketCommand): Promise<CommandResult<SupportTicketResult>> {
    try {
      if (!command.subject || command.subject.trim().length === 0) {
        return CommandResult.failure<SupportTicketResult>("Subject is required", ["subject"]);
      }

      if (!command.source) {
        return CommandResult.failure<SupportTicketResult>("Source is required", ["source"]);
      }

      const ticket = await this.ticketService.createTicket({
        userId: command.userId,
        orderId: command.orderId,
        source: TicketSource.fromString(command.source),
        subject: command.subject,
        priority: command.priority ? TicketPriority.fromString(command.priority) : undefined,
      });

      const result: SupportTicketResult = {
        ticketId: ticket.getTicketId().getValue(),
        userId: ticket.getUserId(),
        orderId: ticket.getOrderId(),
        source: ticket.getSource().getValue(),
        subject: ticket.getSubject(),
        status: ticket.getStatus().getValue(),
        priority: ticket.getPriority()?.getValue(),
        createdAt: ticket.getCreatedAt(),
      };

      return CommandResult.success<SupportTicketResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<SupportTicketResult>("Failed to create support ticket", [
          error.message,
        ]);
      }

      return CommandResult.failure<SupportTicketResult>(
        "An unexpected error occurred while creating support ticket",
      );
    }
  }
}
