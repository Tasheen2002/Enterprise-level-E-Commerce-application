import { ChatMessage } from "../entities/chat-message.entity.js";
import { MessageId, ChatSenderType } from "../value-objects/index.js";

export interface ChatMessageQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ChatMessageFilterOptions {
  sessionId?: string;
  senderId?: string;
  senderType?: ChatSenderType;
  messageType?: string;
  isAutomated?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface IChatMessageRepository {
  // Basic CRUD
  save(message: ChatMessage): Promise<void>;
  delete(messageId: MessageId): Promise<void>;

  // Finders
  findById(messageId: MessageId): Promise<ChatMessage | null>;
  findBySessionId(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findBySenderId(
    senderId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findBySenderType(
    senderType: ChatSenderType,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findAll(options?: ChatMessageQueryOptions): Promise<ChatMessage[]>;

  // Advanced queries
  findWithFilters(
    filters: ChatMessageFilterOptions,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findLatestBySession(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  findUserMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findAgentMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;
  findAutomatedMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]>;

  // Counts
  countBySessionId(sessionId: string): Promise<number>;
  countBySenderType(senderType: ChatSenderType): Promise<number>;
  countAutomated(sessionId?: string): Promise<number>;
  count(filters?: ChatMessageFilterOptions): Promise<number>;

  // Existence checks
  exists(messageId: MessageId): Promise<boolean>;
  hasSessionMessages(sessionId: string): Promise<boolean>;
}
