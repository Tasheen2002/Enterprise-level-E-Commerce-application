import { TicketMessage } from "../entities/ticket-message.entity.js";
import { MessageId, MessageSender } from "../value-objects/index.js";

export interface MessageQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface MessageFilterOptions {
  ticketId?: string;
  sender?: MessageSender;
  startDate?: Date;
  endDate?: Date;
}

export interface ITicketMessageRepository {
  // Basic CRUD
  save(message: TicketMessage): Promise<void>;
  delete(messageId: MessageId): Promise<void>;

  // Finders
  findById(messageId: MessageId): Promise<TicketMessage | null>;
  findByTicketId(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]>;
  findBySender(
    sender: MessageSender,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]>;
  findAll(options?: MessageQueryOptions): Promise<TicketMessage[]>;

  // Advanced queries
  findWithFilters(
    filters: MessageFilterOptions,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]>;
  findLatestByTicket(ticketId: string, limit?: number): Promise<TicketMessage[]>;
  findAgentMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]>;
  findCustomerMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]>;

  // Counts
  countByTicketId(ticketId: string): Promise<number>;
  countBySender(sender: MessageSender): Promise<number>;
  count(filters?: MessageFilterOptions): Promise<number>;

  // Existence checks
  exists(messageId: MessageId): Promise<boolean>;
  hasTicketMessages(ticketId: string): Promise<boolean>;
}
