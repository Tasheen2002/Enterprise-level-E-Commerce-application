import { PrismaClient } from "@prisma/client";
import {
  ITicketMessageRepository,
  MessageQueryOptions,
  MessageFilterOptions,
} from "../../../domain/repositories/ticket-message.repository.js";
import { TicketMessage } from "../../../domain/entities/ticket-message.entity.js";
import {
  MessageId,
  MessageSender,
} from "../../../domain/value-objects/index.js";

export class TicketMessageRepositoryImpl implements ITicketMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): TicketMessage {
    return TicketMessage.fromDatabaseRow({
      message_id: record.id,
      ticket_id: record.ticketId,
      sender: record.sender,
      // sender_id removed, as TicketMessageDatabaseRow does not have this property
      body: record.body,
      created_at: record.createdAt,
    });
  }

  private dehydrate(message: TicketMessage): any {
    const row = message.toDatabaseRow();
    return {
      id: row.message_id,
      ticketId: row.ticket_id,
      sender: row.sender,
      // senderId removed, as TicketMessageDatabaseRow does not have this property
      body: row.body,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: MessageQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "asc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(message: TicketMessage): Promise<void> {
    const data = this.dehydrate(message);
    await this.prisma.ticketMessage.create({ data });
  }

  async delete(messageId: MessageId): Promise<void> {
    await this.prisma.ticketMessage.delete({
      where: { id: messageId.getValue() },
    });
  }

  async findById(messageId: MessageId): Promise<TicketMessage | null> {
    const record = await this.prisma.ticketMessage.findUnique({
      where: { id: messageId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByTicketId(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findBySender(
    sender: MessageSender,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      where: { sender: sender.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: MessageQueryOptions): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: MessageFilterOptions,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    const where: any = {};

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.sender) {
      where.sender = filters.sender.getValue();
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

    const records = await this.prisma.ticketMessage.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findLatestByTicket(
    ticketId: string,
    limit?: number
  ): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAgentMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      where: {
        ticketId,
        sender: "agent",
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findCustomerMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    const records = await this.prisma.ticketMessage.findMany({
      where: {
        ticketId,
        sender: "customer",
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByTicketId(ticketId: string): Promise<number> {
    return await this.prisma.ticketMessage.count({
      where: { ticketId },
    });
  }

  async countBySender(sender: MessageSender): Promise<number> {
    return await this.prisma.ticketMessage.count({
      where: { sender: sender.getValue() as any },
    });
  }

  async count(filters?: MessageFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.ticketMessage.count();
    }

    const where: any = {};

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.sender) {
      where.sender = filters.sender.getValue();
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

    return await this.prisma.ticketMessage.count({ where });
  }

  async exists(messageId: MessageId): Promise<boolean> {
    const count = await this.prisma.ticketMessage.count({
      where: { id: messageId.getValue() },
    });

    return count > 0;
  }

  async hasTicketMessages(ticketId: string): Promise<boolean> {
    const count = await this.prisma.ticketMessage.count({
      where: { ticketId },
    });

    return count > 0;
  }
}
