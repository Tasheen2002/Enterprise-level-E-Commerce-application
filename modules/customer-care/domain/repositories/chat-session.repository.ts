import { ChatSession } from "../entities/chat-session.entity.js";
import { SessionId, ChatStatus, TicketPriority } from "../value-objects/index.js";

export interface ChatSessionQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "startedAt" | "endedAt";
  sortOrder?: "asc" | "desc";
}

export interface ChatSessionFilterOptions {
  userId?: string;
  agentId?: string;
  status?: ChatStatus;
  priority?: TicketPriority;
  startDate?: Date;
  endDate?: Date;
  hasAgent?: boolean;
}

export interface IChatSessionRepository {
  // Basic CRUD
  save(session: ChatSession): Promise<void>;
  update(session: ChatSession): Promise<void>;
  delete(sessionId: SessionId): Promise<void>;

  // Finders
  findById(sessionId: SessionId): Promise<ChatSession | null>;
  findByUserId(
    userId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]>;
  findByAgentId(
    agentId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]>;
  findByStatus(
    status: ChatStatus,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]>;
  findAll(options?: ChatSessionQueryOptions): Promise<ChatSession[]>;

  // Advanced queries
  findWithFilters(
    filters: ChatSessionFilterOptions,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]>;
  findActiveSessions(options?: ChatSessionQueryOptions): Promise<ChatSession[]>;
  findWaitingSessions(options?: ChatSessionQueryOptions): Promise<ChatSession[]>;
  findUnassignedSessions(options?: ChatSessionQueryOptions): Promise<ChatSession[]>;
  findRecentByUser(userId: string, limit?: number): Promise<ChatSession[]>;
  findActiveByAgent(agentId: string): Promise<ChatSession[]>;

  // Counts
  countByStatus(status: ChatStatus): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByAgentId(agentId: string): Promise<number>;
  countActiveByAgent(agentId: string): Promise<number>;
  count(filters?: ChatSessionFilterOptions): Promise<number>;

  // Existence checks
  exists(sessionId: SessionId): Promise<boolean>;
  hasActiveSessions(userId: string): Promise<boolean>;
}
