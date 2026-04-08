import { SupportTicket } from "../entities/support-ticket.entity.js";
import {
  TicketId,
  TicketStatus,
  TicketSource,
  TicketPriority,
} from "../value-objects/index.js";

export interface TicketQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "subject" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface TicketFilterOptions {
  userId?: string;
  orderId?: string;
  status?: TicketStatus;
  source?: TicketSource;
  priority?: TicketPriority;
  startDate?: Date;
  endDate?: Date;
}

export interface ISupportTicketRepository {
  // Basic CRUD
  save(ticket: SupportTicket): Promise<void>;
  update(ticket: SupportTicket): Promise<void>;
  delete(ticketId: TicketId): Promise<void>;

  // Finders
  findById(ticketId: TicketId): Promise<SupportTicket | null>;
  findByUserId(
    userId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findByOrderId(
    orderId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findByStatus(
    status: TicketStatus,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findBySource(
    source: TicketSource,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findByPriority(
    priority: TicketPriority,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findAll(options?: TicketQueryOptions): Promise<SupportTicket[]>;

  // Advanced queries
  findWithFilters(
    filters: TicketFilterOptions,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]>;
  findOpenTickets(options?: TicketQueryOptions): Promise<SupportTicket[]>;
  findUnassignedTickets(options?: TicketQueryOptions): Promise<SupportTicket[]>;
  findRecentByUser(
    userId: string,
    limit?: number
  ): Promise<SupportTicket[]>;

  // Counts and statistics
  countByStatus(status: TicketStatus): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countBySource(source: TicketSource): Promise<number>;
  count(filters?: TicketFilterOptions): Promise<number>;

  // Existence checks
  exists(ticketId: TicketId): Promise<boolean>;
  hasUserTickets(userId: string): Promise<boolean>;
  hasOrderTickets(orderId: string): Promise<boolean>;
}
