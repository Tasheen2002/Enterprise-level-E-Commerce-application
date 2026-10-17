import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";

// Base interfaces

export interface GetSupportTicketQuery extends IQuery {
  ticketId: string;
}

export interface SupportTicketDto {
  ticketId: string;
  userId?: string;
  orderId?: string;
  source: string;
  subject: string;
  status: string;
  priority?: string;
  createdAt: Date;
}

export class GetSupportTicketHandler
  implements IQueryHandler<GetSupportTicketQuery, QueryResult<SupportTicketDto | null>>
{
  constructor(private readonly supportTicketService: SupportTicketService) {}

  async handle(query: GetSupportTicketQuery): Promise<QueryResult<SupportTicketDto | null>> {
    try {
      if (!query.ticketId) {
        return QueryResult.failure<SupportTicketDto | null>("Ticket ID is required", ["ticketId"]);
      }

      const ticket = await this.supportTicketService.getTicket(query.ticketId);
      if (!ticket) {
        return QueryResult.success<SupportTicketDto | null>(null);
      }
      const result: SupportTicketDto = {
        ticketId: ticket.getTicketId().getValue(),
        userId: ticket.getUserId(),
        orderId: ticket.getOrderId(),
        source: ticket.getSource().getValue(),
        subject: ticket.getSubject(),
        status: ticket.getStatus().getValue(),
        priority: ticket.getPriority()?.getValue(),
        createdAt: ticket.getCreatedAt(),
      };
      return QueryResult.success<SupportTicketDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<SupportTicketDto | null>("Failed to get support ticket", [
          error.message,
        ]);
      }
      return QueryResult.failure<SupportTicketDto | null>(
        "An unexpected error occurred while getting support ticket",
      );
    }
  }
}
