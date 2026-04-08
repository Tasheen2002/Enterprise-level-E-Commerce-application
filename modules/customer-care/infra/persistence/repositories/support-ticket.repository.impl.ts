import { PrismaClient } from "@prisma/client";
import {
  ISupportTicketRepository,
  TicketQueryOptions,
  TicketFilterOptions,
} from "../../../domain/repositories/support-ticket.repository.js";
import { SupportTicket } from "../../../domain/entities/support-ticket.entity.js";
import {
  TicketId,
  TicketStatus,
  TicketPriority,
  TicketSource,
} from "../../../domain/value-objects/index.js";

export class SupportTicketRepositoryImpl implements ISupportTicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): SupportTicket {
    return SupportTicket.fromDatabaseRow({
      ticket_id: record.id,
      user_id: record.userId,
      order_id: record.orderId,
      source: record.source,
      subject: record.subject,
      status: record.status,
      priority: record.priority,
      created_at: record.createdAt,
    });
  }

  private dehydrate(ticket: SupportTicket): any {
    const row = ticket.toDatabaseRow();
    return {
      id: row.ticket_id,
      userId: row.user_id,
      orderId: row.order_id,
      source: row.source,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: TicketQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(ticket: SupportTicket): Promise<void> {
    const data = this.dehydrate(ticket);
    await this.prisma.supportTicket.create({ data });
  }

  async update(ticket: SupportTicket): Promise<void> {
    const data = this.dehydrate(ticket);
    const { id, ...updateData } = data;
    await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(ticketId: TicketId): Promise<void> {
    await this.prisma.supportTicket.delete({
      where: { id: ticketId.getValue() },
    });
  }

  async findById(ticketId: TicketId): Promise<SupportTicket | null> {
    const record = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByOrderId(
    orderId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { orderId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findBySource(
    source: TicketSource,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { source: source.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: TicketStatus,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByPriority(
    priority: TicketPriority,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { priority: priority.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: TicketQueryOptions): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: TicketFilterOptions,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.source) {
      where.source = filters.source.getValue();
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.priority) {
      where.priority = filters.priority.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.supportTicket.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findOpenTickets(options?: TicketQueryOptions): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { status: "open" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findResolvedTickets(
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { status: "resolved" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findClosedTickets(
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { status: "closed" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUnassignedTickets(
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    // Unassigned tickets are those that are open but not yet in progress
    const records = await this.prisma.supportTicket.findMany({
      where: { status: "open" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findRecentByUser(
    userId: string,
    limit?: number
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findOrderRelatedTickets(
    orderId: string,
    options?: TicketQueryOptions
  ): Promise<SupportTicket[]> {
    const records = await this.prisma.supportTicket.findMany({
      where: { orderId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByStatus(status: TicketStatus): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: { status: status.getValue() as any },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: { userId },
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: { orderId },
    });
  }

  async countByPriority(priority: TicketPriority): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: { priority: priority.getValue() as any },
    });
  }

  async countBySource(source: TicketSource): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: { source: source.getValue() as any },
    });
  }

  async count(filters?: TicketFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.supportTicket.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.source) {
      where.source = filters.source.getValue();
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.priority) {
      where.priority = filters.priority.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await this.prisma.supportTicket.count({ where });
  }

  async exists(ticketId: TicketId): Promise<boolean> {
    const count = await this.prisma.supportTicket.count({
      where: { id: ticketId.getValue() },
    });

    return count > 0;
  }

  async existsByOrderId(orderId: string): Promise<boolean> {
    const count = await this.prisma.supportTicket.count({
      where: { orderId },
    });

    return count > 0;
  }

  async hasUserTickets(userId: string): Promise<boolean> {
    const count = await this.prisma.supportTicket.count({
      where: { userId },
    });

    return count > 0;
  }

  async hasOrderTickets(orderId: string): Promise<boolean> {
    const count = await this.prisma.supportTicket.count({
      where: { orderId },
    });

    return count > 0;
  }

  async hasOpenTickets(userId: string): Promise<boolean> {
    const count = await this.prisma.supportTicket.count({
      where: {
        userId,
        status: "open",
      },
    });

    return count > 0;
  }
}
