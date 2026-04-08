import { ChatSessionService } from "../services/chat-session.service.js";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

export interface ListChatSessionsQuery extends IQuery {}

export interface ChatSessionDto {
  sessionId: string;
  userId?: string;
  agentId?: string;
  status?: string;
  topic?: string;
  priority?: string;
  startedAt: Date;
  endedAt?: Date;
}

export class ListChatSessionsHandler
  implements IQueryHandler<ListChatSessionsQuery, QueryResult<ChatSessionDto[]>>
{
  constructor(private readonly chatSessionService: ChatSessionService) {}

  async handle(
    query: ListChatSessionsQuery
  ): Promise<QueryResult<ChatSessionDto[]>> {
    try {
      const sessions = await this.chatSessionService.getAllSessions();
      const result: ChatSessionDto[] = sessions.map((session) => ({
        sessionId: session.getSessionId().getValue(),
        userId: session.getUserId(),
        agentId: session.getAgentId(),
        status: session.getStatus()?.getValue(),
        topic: session.getTopic(),
        priority: session.getPriority()?.getValue(),
        startedAt: session.getStartedAt(),
        endedAt: session.getEndedAt(),
      }));
      return QueryResult.success<ChatSessionDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ChatSessionDto[]>(
          "Failed to list chat sessions",
          [error.message]
        );
      }
      return QueryResult.failure<ChatSessionDto[]>(
        "An unexpected error occurred while listing chat sessions"
      );
    }
  }
}
