import { ChatSessionService } from "../services/chat-session.service.js";

// Base interfaces
export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): QueryResult<T> {
    return new QueryResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): QueryResult<T> {
    return new QueryResult<T>(false, undefined, error, errors);
  }
}

export interface GetChatSessionQuery extends IQuery {
  sessionId: string;
}

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

export class GetChatSessionHandler
  implements
    IQueryHandler<GetChatSessionQuery, QueryResult<ChatSessionDto | null>>
{
  constructor(private readonly chatSessionService: ChatSessionService) {}

  async handle(
    query: GetChatSessionQuery
  ): Promise<QueryResult<ChatSessionDto | null>> {
    try {
      if (!query.sessionId) {
        return QueryResult.failure<ChatSessionDto | null>(
          "Session ID is required",
          ["sessionId"]
        );
      }

      const session = await this.chatSessionService.getSession(query.sessionId);
      if (!session) {
        return QueryResult.success<ChatSessionDto | null>(null);
      }
      const result: ChatSessionDto = {
        sessionId: session.getSessionId().getValue(),
        userId: session.getUserId(),
        agentId: session.getAgentId(),
        status: session.getStatus()?.getValue(),
        topic: session.getTopic(),
        priority: session.getPriority()?.getValue(),
        startedAt: session.getStartedAt(),
        endedAt: session.getEndedAt(),
      };
      return QueryResult.success<ChatSessionDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ChatSessionDto | null>(
          "Failed to get chat session",
          [error.message]
        );
      }
      return QueryResult.failure<ChatSessionDto | null>(
        "An unexpected error occurred while getting chat session"
      );
    }
  }
}
