import {
  ISupportTicketRepository,
  TicketQueryOptions,
  TicketFilterOptions,
} from "../../domain/repositories/support-ticket.repository.js";
import { SupportTicket } from "../../domain/entities/support-ticket.entity.js";
import {
  TicketId,
  TicketStatus,
  TicketSource,
  TicketPriority,
} from "../../domain/value-objects/index.js";

export class SupportTicketService {
  constructor(private readonly ticketRepository: ISupportTicketRepository) {}

  async createTicket(data: {
    userId?: string;
    orderId?: string;
    source: TicketSource;
    subject: string;
    priority?: TicketPriority;
  }): Promise<SupportTicket> {
    const ticket = SupportTicket.create({
      userId: data.userId,
      orderId: data.orderId,
      source: data.source,
      subject: data.subject,
      priority: data.priority,
    });

    await this.ticketRepository.save(ticket);
    return ticket;
  }

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    return await this.ticketRepository.findById(TicketId.create(ticketId));
  }

  async updateTicketSubject(
    ticketId: string,
    newSubject: string
  ): Promise<void> {
    const ticket = await this.ticketRepository.findById(
      TicketId.create(ticketId)
    );

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    ticket.updateSubject(newSubject);
    await this.ticketRepository.update(ticket);
  }

  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus
  ): Promise<void> {
    const ticket = await this.ticketRepository.findById(
      TicketId.create(ticketId)
    );

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    ticket.updateStatus(newStatus);
    await this.ticketRepository.update(ticket);
  }

  async updateTicketPriority(
    ticketId: string,
    newPriority: TicketPriority
  ): Promise<void> {
    const ticket = await this.ticketRepository.findById(
      TicketId.create(ticketId)
    );

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    ticket.updatePriority(newPriority);
    await this.ticketRepository.update(ticket);
  }

  async closeTicket(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepository.findById(
      TicketId.create(ticketId)
    );

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    ticket.close();
    await this.ticketRepository.update(ticket);
  }

  async reopenTicket(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepository.findById(
      TicketId.create(ticketId)
    );

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    ticket.reopen();
    await this.ticketRepository.update(ticket);
  }

  async deleteTicket(ticketId: string): Promise<void> {
    const exists = await this.ticketRepository.exists(
      TicketId.create(ticketId)
    );

    if (!exists) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    await this.ticketRepository.delete(TicketId.create(ticketId));
  }

  async getTicketsByUser(
    userId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findByUserId(userId, options);
  }

  async getTicketsByOrder(
    orderId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findByOrderId(orderId, options);
  }

  async getTicketsByStatus(
    status: TicketStatus,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findByStatus(status, options);
  }

  async getTicketsBySource(
    source: TicketSource,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findBySource(source, options);
  }

  async getTicketsByPriority(
    priority: TicketPriority,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findByPriority(priority, options);
  }

  async getOpenTickets(options?: TicketQueryOptions): Promise<SupportTicket[]> {
    return await this.ticketRepository.findOpenTickets(options);
  }

  async getUnassignedTickets(
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findUnassignedTickets(options);
  }

  async getRecentTicketsByUser(
    userId: string,
    limit?: number
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findRecentByUser(userId, limit);
  }

  async getTicketsWithFilters(
    filters: TicketFilterOptions,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    return await this.ticketRepository.findWithFilters(filters, options);
  }

  async getAllTickets(options?: TicketQueryOptions): Promise<SupportTicket[]> {
    return await this.ticketRepository.findAll(options);
  }

  async countTicketsByStatus(status: TicketStatus): Promise<number> {
    return await this.ticketRepository.countByStatus(status);
  }

  async countTicketsByUser(userId: string): Promise<number> {
    return await this.ticketRepository.countByUserId(userId);
  }

  async countTicketsBySource(source: TicketSource): Promise<number> {
    return await this.ticketRepository.countBySource(source);
  }

  async countTickets(filters?: TicketFilterOptions): Promise<number> {
    return await this.ticketRepository.count(filters);
  }

  async ticketExists(ticketId: string): Promise<boolean> {
    return await this.ticketRepository.exists(TicketId.create(ticketId));
  }

  async hasUserTickets(userId: string): Promise<boolean> {
    return await this.ticketRepository.hasUserTickets(userId);
  }

  async hasOrderTickets(orderId: string): Promise<boolean> {
    return await this.ticketRepository.hasOrderTickets(orderId);
  }
}
