import {
  IChatSessionRepository,
  ChatSessionQueryOptions,
  ChatSessionFilterOptions,
} from "../../domain/repositories/chat-session.repository.js";
import { ChatSession } from "../../domain/entities/chat-session.entity.js";
import {
  SessionId,
  ChatStatus,
  TicketPriority,
} from "../../domain/value-objects/index.js";

export class ChatSessionService {
  constructor(private readonly sessionRepository: IChatSessionRepository) {}

  async createSession(data: {
    userId?: string;
    topic?: string;
    priority?: TicketPriority;
  }): Promise<ChatSession> {
    const session = ChatSession.create({
      userId: data.userId,
      topic: data.topic,
      priority: data.priority,
    });

    await this.sessionRepository.save(session);
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return await this.sessionRepository.findById(SessionId.create(sessionId));
  }

  async assignAgent(sessionId: string, agentId: string): Promise<void> {
    const session = await this.sessionRepository.findById(
      SessionId.create(sessionId)
    );

    if (!session) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    session.assignAgent(agentId);
    await this.sessionRepository.update(session);
  }

  async updateSessionStatus(
    sessionId: string,
    newStatus: ChatStatus
  ): Promise<void> {
    const session = await this.sessionRepository.findById(
      SessionId.create(sessionId)
    );

    if (!session) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    session.updateStatus(newStatus);
    await this.sessionRepository.update(session);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(
      SessionId.create(sessionId)
    );

    if (!session) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    session.end();
    await this.sessionRepository.update(session);
  }

  async updateTopic(sessionId: string, newTopic: string): Promise<void> {
    const session = await this.sessionRepository.findById(
      SessionId.create(sessionId)
    );

    if (!session) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    session.updateTopic(newTopic);
    await this.sessionRepository.update(session);
  }

  async updatePriority(
    sessionId: string,
    newPriority: TicketPriority
  ): Promise<void> {
    const session = await this.sessionRepository.findById(
      SessionId.create(sessionId)
    );

    if (!session) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    session.updatePriority(newPriority);
    await this.sessionRepository.update(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const exists = await this.sessionRepository.exists(
      SessionId.create(sessionId)
    );

    if (!exists) {
      throw new Error(`Chat session with ID ${sessionId} not found`);
    }

    await this.sessionRepository.delete(SessionId.create(sessionId));
  }

  async getSessionsByUser(
    userId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findByUserId(userId, options);
  }

  async getSessionsByAgent(
    agentId: string,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findByAgentId(agentId, options);
  }

  async getSessionsByStatus(
    status: ChatStatus,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findByStatus(status, options);
  }

  async getActiveSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findActiveSessions(options);
  }

  async getWaitingSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findWaitingSessions(options);
  }

  async getUnassignedSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findUnassignedSessions(options);
  }

  async getRecentSessionsByUser(
    userId: string,
    limit?: number
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findRecentByUser(userId, limit);
  }

  async getActiveSessionsByAgent(agentId: string): Promise<ChatSession[]> {
    return await this.sessionRepository.findActiveByAgent(agentId);
  }

  async getSessionsWithFilters(
    filters: ChatSessionFilterOptions,
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findWithFilters(filters, options);
  }

  async getAllSessions(
    options?: ChatSessionQueryOptions
  ): Promise<ChatSession[]> {
    return await this.sessionRepository.findAll(options);
  }

  async countSessionsByStatus(status: ChatStatus): Promise<number> {
    return await this.sessionRepository.countByStatus(status);
  }

  async countSessionsByUser(userId: string): Promise<number> {
    return await this.sessionRepository.countByUserId(userId);
  }

  async countSessionsByAgent(agentId: string): Promise<number> {
    return await this.sessionRepository.countByAgentId(agentId);
  }

  async countActiveSessionsByAgent(agentId: string): Promise<number> {
    return await this.sessionRepository.countActiveByAgent(agentId);
  }

  async countSessions(filters?: ChatSessionFilterOptions): Promise<number> {
    return await this.sessionRepository.count(filters);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    return await this.sessionRepository.exists(SessionId.create(sessionId));
  }

  async hasActiveSessions(userId: string): Promise<boolean> {
    return await this.sessionRepository.hasActiveSessions(userId);
  }
}
