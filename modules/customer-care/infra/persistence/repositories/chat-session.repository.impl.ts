import { PrismaClient } from "@prisma/client";
import {
  IChatSessionRepository,
  ChatSessionQueryOptions,
  ChatSessionFilterOptions,
} from "../../../domain/repositories/chat-session.repository.js";
import { ChatSession } from "../../../domain/entities/chat-session.entity.js";
import { SessionId, ChatStatus } from "../../../domain/value-objects/index.js";

export class ChatSessionRepositoryImpl implements IChatSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): ChatSession {
    return ChatSession.fromDatabaseRow({
      session_id: record.id,
      user_id: record.userId,
      agent_id: record.agentId,
      status: record.status,
      topic: record.topic,
      priority: record.priority,
      started_at: record.startedAt,
      ended_at: record.endedAt,
    });
  }

  private dehydrate(session: ChatSession): any {
    const row = session.toDatabaseRow();
    return {
      id: row.session_id,
      userId: row.user_id,
      agentId: row.agent_id,
      status: row.status,
      topic: row.topic,
      priority: row.priority,
      startedAt: row.started_at,
      endedAt: row.ended_at,
    };
  }

  private buildOrderBy(options?: ChatSessionQueryOptions): any {
    if (!options?.sortBy) {
      return { startedAt: "desc" };
    }

    const sortField =
      options.sortBy === "endedAt" ? "endedAt" : "startedAt";

    return {
      [sortField]: options.sortOrder || "asc",
    };
  }

  async save(session: ChatSession): Promise<void> {
    const data = this.dehydrate(session);
    await this.prisma.chatSession.create({ data });
  }

  async update(session: ChatSession): Promise<void> {
    const data = this.dehydrate(session);
    const { id, ...updateData } = data;
    await this.prisma.chatSession.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(sessionId: SessionId): Promise<void> {
    await this.prisma.chatSession.delete({
      where: { id: sessionId.getValue() },
    });
  }

  async findById(sessionId: SessionId): Promise<ChatSession | null> {
    const record = await this.prisma.chatSession.findUnique({
      where: { id: sessionId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByAgentId(
    agentId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { agentId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: ChatStatus,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: ChatSessionQueryOptions): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: ChatSessionFilterOptions,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.agentId) {
      where.agentId = filters.agentId;
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.priority) {
      where.priority = filters.priority.getValue();
    }

    if (filters.hasAgent !== undefined) {
      where.agentId = filters.hasAgent ? { not: null } : null;
    }

    if (filters.startDate || filters.endDate) {
      where.startedAt = {};
      if (filters.startDate) {
        where.startedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startedAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.chatSession.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findActiveSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { status: "active" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWaitingSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { status: "waiting" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUnassignedSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: {
        agentId: null,
        status: { not: "ended" },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findRecentByUser(userId: string, limit?: number): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findActiveByAgent(agentId: string): Promise<ChatSession[]> {
    const records = await this.prisma.chatSession.findMany({
      where: {
        agentId,
        status: "active",
      },
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByStatus(status: ChatStatus): Promise<number> {
    return await this.prisma.chatSession.count({
      where: { status: status.getValue() as any },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.chatSession.count({
      where: { userId },
    });
  }

  async countByAgentId(agentId: string): Promise<number> {
    return await this.prisma.chatSession.count({
      where: { agentId },
    });
  }

  async countActiveByAgent(agentId: string): Promise<number> {
    return await this.prisma.chatSession.count({
      where: {
        agentId,
        status: "active",
      },
    });
  }

  async count(filters?: ChatSessionFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.chatSession.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.agentId) {
      where.agentId = filters.agentId;
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.hasAgent !== undefined) {
      where.agentId = filters.hasAgent ? { not: null } : null;
    }

    if (filters.startDate || filters.endDate) {
      where.startedAt = {};
      if (filters.startDate) {
        where.startedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startedAt.lte = filters.endDate;
      }
    }

    return await this.prisma.chatSession.count({ where });
  }

  async exists(sessionId: SessionId): Promise<boolean> {
    const count = await this.prisma.chatSession.count({
      where: { id: sessionId.getValue() },
    });

    return count > 0;
  }

  async hasActiveSessions(userId: string): Promise<boolean> {
    const count = await this.prisma.chatSession.count({
      where: {
        userId,
        status: "active",
      },
    });

    return count > 0;
  }
}
