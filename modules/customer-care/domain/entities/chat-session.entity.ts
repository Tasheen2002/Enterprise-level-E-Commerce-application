import {
  SessionId,
  ChatStatus,
  TicketPriority,
} from "../value-objects/index.js";

export class ChatSession {
  private constructor(
    private readonly sessionId: SessionId,
    private readonly userId: string | undefined,
    private agentId: string | undefined,
    private status: ChatStatus | undefined,
    private topic: string | undefined,
    private priority: TicketPriority | undefined,
    private readonly startedAt: Date,
    private endedAt: Date | undefined
  ) {}

  static create(data: CreateChatSessionData): ChatSession {
    const sessionId = SessionId.generate();
    const now = new Date();

    return new ChatSession(
      sessionId,
      data.userId,
      undefined,
      ChatStatus.waiting(),
      data.topic,
      data.priority,
      now,
      undefined
    );
  }

  static reconstitute(data: ChatSessionData): ChatSession {
    return new ChatSession(
      SessionId.create(data.sessionId),
      data.userId,
      data.agentId,
      data.status,
      data.topic,
      data.priority,
      data.startedAt,
      data.endedAt
    );
  }

  static fromDatabaseRow(row: ChatSessionDatabaseRow): ChatSession {
    return new ChatSession(
      SessionId.create(row.session_id),
      row.user_id || undefined,
      row.agent_id || undefined,
      row.status ? ChatStatus.fromString(row.status) : undefined,
      row.topic || undefined,
      row.priority ? TicketPriority.fromString(row.priority) : undefined,
      row.started_at,
      row.ended_at || undefined
    );
  }

  // Getters
  getSessionId(): SessionId {
    return this.sessionId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getAgentId(): string | undefined {
    return this.agentId;
  }

  getStatus(): ChatStatus | undefined {
    return this.status;
  }

  getTopic(): string | undefined {
    return this.topic;
  }

  getPriority(): TicketPriority | undefined {
    return this.priority;
  }

  getStartedAt(): Date {
    return this.startedAt;
  }

  getEndedAt(): Date | undefined {
    return this.endedAt;
  }

  // Business logic methods
  assignAgent(agentId: string): void {
    if (!agentId || agentId.trim().length === 0) {
      throw new Error("Agent ID cannot be empty");
    }

    if (this.isEnded()) {
      throw new Error("Cannot assign agent to ended session");
    }

    this.agentId = agentId;
    this.status = ChatStatus.active();
  }

  updateStatus(newStatus: ChatStatus): void {
    if (this.isEnded()) {
      throw new Error("Cannot update status of ended session");
    }

    this.status = newStatus;
  }

  updateTopic(newTopic: string): void {
    if (this.isEnded()) {
      throw new Error("Cannot update topic of ended session");
    }

    this.topic = newTopic || undefined;
  }

  updatePriority(newPriority: TicketPriority): void {
    if (this.isEnded()) {
      throw new Error("Cannot update priority of ended session");
    }

    this.priority = newPriority;
  }

  end(): void {
    if (this.isEnded()) {
      throw new Error("Session is already ended");
    }

    this.status = ChatStatus.ended();
    this.endedAt = new Date();
  }

  // Validation methods
  hasAgent(): boolean {
    return !!this.agentId;
  }

  isWaiting(): boolean {
    return this.status?.isWaiting() || false;
  }

  isActive(): boolean {
    return this.status?.isActive() || false;
  }

  isEnded(): boolean {
    return this.status?.isEnded() || !!this.endedAt;
  }

  hasTopic(): boolean {
    return !!this.topic;
  }

  hasPriority(): boolean {
    return !!this.priority;
  }

  getDuration(): number | undefined {
    if (!this.endedAt) {
      return undefined;
    }
    return this.endedAt.getTime() - this.startedAt.getTime();
  }

  // Convert to data for persistence
  toData(): ChatSessionData {
    return {
      sessionId: this.sessionId.getValue(),
      userId: this.userId,
      agentId: this.agentId,
      status: this.status,
      topic: this.topic,
      priority: this.priority,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }

  toDatabaseRow(): ChatSessionDatabaseRow {
    return {
      session_id: this.sessionId.getValue(),
      user_id: this.userId || null,
      agent_id: this.agentId || null,
      status: this.status?.getValue() || null,
      topic: this.topic || null,
      priority: this.priority?.getValue() || null,
      started_at: this.startedAt,
      ended_at: this.endedAt || null,
    };
  }

  equals(other: ChatSession): boolean {
    return this.sessionId.equals(other.sessionId);
  }
}

// Supporting types and interfaces
export interface CreateChatSessionData {
  userId?: string;
  topic?: string;
  priority?: TicketPriority;
}

export interface ChatSessionData {
  sessionId: string;
  userId?: string;
  agentId?: string;
  status?: ChatStatus;
  topic?: string;
  priority?: TicketPriority;
  startedAt: Date;
  endedAt?: Date;
}

export interface ChatSessionDatabaseRow {
  session_id: string;
  user_id: string | null;
  agent_id: string | null;
  status: string | null;
  topic: string | null;
  priority: string | null;
  started_at: Date;
  ended_at: Date | null;
}
