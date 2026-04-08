import { PrismaClient, Prisma } from "@prisma/client";
import {
  IChatMessageRepository,
  ChatMessageQueryOptions,
  ChatMessageFilterOptions,
} from "../../../domain/repositories/chat-message.repository.js";
import { ChatMessage } from "../../../domain/entities/chat-message.entity.js";
import {
  MessageId,
  ChatSenderType,
} from "../../../domain/value-objects/index.js";

type PrismaWhere = Prisma.ChatMessageWhereInput;

export class ChatMessageRepositoryImpl implements IChatMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // Hydration helpers
  // ---------------------------------------------------------------------------
  private hydrate(record: any): ChatMessage {
    return ChatMessage.fromDatabaseRow({
      message_id: record.id,
      session_id: record.sessionId,
      sender_id: record.senderId,
      sender_type: record.senderType,
      message_type: record.messageType,
      content: record.content,
      metadata: record.metadata,
      is_automated: record.isAutomated,
      created_at: record.createdAt,
    });
  }

  private dehydrate(message: ChatMessage): any {
    const row = message.toDatabaseRow();
    return {
      id: row.message_id,
      sessionId: row.session_id,
      senderId: row.sender_id,
      senderType: row.sender_type,
      messageType: row.message_type,
      content: row.content,
      metadata: row.metadata,
      isAutomated: row.is_automated,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: ChatMessageQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "asc" };
    }

    const field = options.sortBy === "createdAt" ? "createdAt" : "createdAt";
    const direction = options.sortOrder ?? "asc";

    return {
      [field]: direction,
    };
  }

  private buildWhere(filters?: ChatMessageFilterOptions): PrismaWhere {
    if (!filters) {
      return {};
    }

    const where: any = {};
    const andConditions: any[] = [];

    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.senderId) {
      where.senderId = filters.senderId;
    }

    if (filters.senderType) {
      where.senderType = filters.senderType.getValue() as "user" | "agent";
    }

    if (filters.messageType) {
      where.message_type = filters.messageType;
    }

    if (filters.isAutomated !== undefined) {
      where.is_automated = filters.isAutomated;
    }

    // Date range conditions
    const createdAtConditions: any = {};
    if (filters.startDate) {
      createdAtConditions.gte = filters.startDate;
    }
    if (filters.endDate) {
      createdAtConditions.lte = filters.endDate;
    }
    if (Object.keys(createdAtConditions).length > 0) {
      andConditions.push({ created_at: createdAtConditions });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  private async findMany(
    where: PrismaWhere,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    const records = await this.prisma.chatMessage.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  private async countWithWhere(where: PrismaWhere): Promise<number> {
    return this.prisma.chatMessage.count({ where });
  }

  // ---------------------------------------------------------------------------
  // Basic CRUD
  // ---------------------------------------------------------------------------

  async save(message: ChatMessage): Promise<void> {
    const data = this.dehydrate(message);
    await this.prisma.chatMessage.create({ data });
  }

  async delete(messageId: MessageId): Promise<void> {
    await this.prisma.chatMessage.delete({
      where: { id: messageId.getValue() },
    });
  }

  // ---------------------------------------------------------------------------
  // Finders
  // ---------------------------------------------------------------------------
  async findById(messageId: MessageId): Promise<ChatMessage | null> {
    const record = await this.prisma.chatMessage.findUnique({
      where: { id: messageId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findBySessionId(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return this.findMany({ sessionId }, options);
  }

  async findBySenderId(
    senderId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return this.findMany({ senderId }, options);
  }

  async findBySenderType(
    senderType: ChatSenderType,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    const senderTypeValue = senderType.getValue() as "user" | "agent";
    return this.findMany({ senderType: senderTypeValue }, options);
  }

  async findAll(options?: ChatMessageQueryOptions): Promise<ChatMessage[]> {
    return this.findMany({}, options);
  }

  // ---------------------------------------------------------------------------
  // Advanced queries
  // ---------------------------------------------------------------------------
  async findWithFilters(
    filters: ChatMessageFilterOptions,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    const where = this.buildWhere(filters);
    return this.findMany(where, options);
  }

  async findLatestBySession(
    sessionId: string,
    limit?: number
  ): Promise<ChatMessage[]> {
    const records = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { created_at: "desc" } as any,
      take: limit ?? 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUserMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return this.findMany(
      {
        sessionId,
        senderType: "user",
      },
      options
    );
  }

  async findAgentMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return this.findMany(
      {
        sessionId,
        senderType: "agent",
      },
      options
    );
  }

  async findAutomatedMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return this.findMany(
      {
        sessionId,
        is_automated: true,
      } as any,
      options
    );
  }

  // ---------------------------------------------------------------------------
  // Counts
  // ---------------------------------------------------------------------------
  async countBySessionId(sessionId: string): Promise<number> {
    return this.prisma.chatMessage.count({ where: { sessionId } });
  }

  async countBySenderType(senderType: ChatSenderType): Promise<number> {
    const senderTypeValue = senderType.getValue() as "user" | "agent";
    return this.prisma.chatMessage.count({
      where: { senderType: senderTypeValue },
    });
  }

  async countAutomated(sessionId?: string): Promise<number> {
    const where: any = { is_automated: true };
    if (sessionId) {
      where.sessionId = sessionId;
    }
    return this.prisma.chatMessage.count({ where });
  }

  async count(filters?: ChatMessageFilterOptions): Promise<number> {
    const where = this.buildWhere(filters);
    return this.prisma.chatMessage.count({ where });
  }

  // ---------------------------------------------------------------------------
  // Existence checks
  // ---------------------------------------------------------------------------
  async exists(messageId: MessageId): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: { id: messageId.getValue() },
    });

    return count > 0;
  }

  async hasSessionMessages(sessionId: string): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: { sessionId },
    });

    return count > 0;
  }
}
