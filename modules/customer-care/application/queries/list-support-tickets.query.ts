import { SupportTicketService } from "../services/support-ticket.service.js";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

export interface ListSupportTicketsQuery extends IQuery {}

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

export class ListSupportTicketsHandler
  implements
    IQueryHandler<ListSupportTicketsQuery, QueryResult<SupportTicketDto[]>>
{
  constructor(private readonly supportTicketService: SupportTicketService) {}

  async handle(
    query: ListSupportTicketsQuery
  ): Promise<QueryResult<SupportTicketDto[]>> {
    try {
      const tickets = await this.supportTicketService.getAllTickets();
      const result: SupportTicketDto[] = tickets.map((ticket) => ({
        ticketId: ticket.getTicketId().getValue(),
        userId: ticket.getUserId(),
        orderId: ticket.getOrderId(),
        source: ticket.getSource().getValue(),
        subject: ticket.getSubject(),
        status: ticket.getStatus().getValue(),
        priority: ticket.getPriority()?.getValue(),
        createdAt: ticket.getCreatedAt(),
      }));
      return QueryResult.success<SupportTicketDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<SupportTicketDto[]>(
          "Failed to list support tickets",
          [error.message]
        );
      }
      return QueryResult.failure<SupportTicketDto[]>(
        "An unexpected error occurred while listing support tickets"
      );
    }
  }
}
