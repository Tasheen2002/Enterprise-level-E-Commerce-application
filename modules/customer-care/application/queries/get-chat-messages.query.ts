import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { ChatMessageService } from "../services/chat-message.service.js";

// Base interfaces

export interface GetChatMessagesQuery extends IQuery {
  sessionId: string;
}

export interface ChatMessageDto {
  messageId: string;
  sessionId: string;
  senderId?: string;
  senderType: string;
  messageType?: string;
  content?: string;
  metadata: Record<string, any>;
  isAutomated: boolean;
  createdAt: Date;
}

export class GetChatMessagesHandler
  implements IQueryHandler<GetChatMessagesQuery, QueryResult<ChatMessageDto[]>>
{
  constructor(private readonly chatMessageService: ChatMessageService) {}

  async handle(query: GetChatMessagesQuery): Promise<QueryResult<ChatMessageDto[]>> {
    try {
      if (!query.sessionId) {
        return QueryResult.failure<ChatMessageDto[]>("Session ID is required", ["sessionId"]);
      }

      const messages = await this.chatMessageService.getMessagesBySession(query.sessionId);
      const result = messages.map((msg) => ({
        messageId: msg.getMessageId().getValue(),
        sessionId: msg.getSessionId(),
        senderId: msg.getSenderId(),
        senderType: msg.getSenderType().getValue(),
        messageType: msg.getMessageType(),
        content: msg.getContent(),
        metadata: msg.getMetadata(),
        isAutomated: msg.isAutomatedMessage(),
        createdAt: msg.getCreatedAt(),
      }));
      return QueryResult.success<ChatMessageDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ChatMessageDto[]>("Failed to get chat messages", [
          error.message,
        ]);
      }
      return QueryResult.failure<ChatMessageDto[]>(
        "An unexpected error occurred while getting chat messages",
      );
    }
  }
}
