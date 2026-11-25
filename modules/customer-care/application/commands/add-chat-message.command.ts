import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ChatMessageService } from "../services/chat-message.service.js";
import { ChatSenderType } from "../../domain/value-objects/index.js";

export interface AddChatMessageCommand extends ICommand {
  sessionId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, any>;
  isAutomated?: boolean;
}

export interface ChatMessageResult {
  messageId: string;
  sessionId: string;
  senderId?: string;
  senderType: string;
  content?: string;
  messageType?: string;
  isAutomated: boolean;
  createdAt: Date;
}

export class AddChatMessageHandler
  implements ICommandHandler<AddChatMessageCommand, CommandResult<ChatMessageResult>>
{
  constructor(private readonly messageService: ChatMessageService) {}

  async handle(command: AddChatMessageCommand): Promise<CommandResult<ChatMessageResult>> {
    try {
      if (!command.sessionId) {
        return CommandResult.failure<ChatMessageResult>("Session ID is required", ["sessionId"]);
      }
      if (!command.senderId) {
        return CommandResult.failure<ChatMessageResult>("Sender ID is required", ["senderId"]);
      }
      if (!command.senderType) {
        return CommandResult.failure<ChatMessageResult>("Sender type is required", ["senderType"]);
      }
      if (!command.content || command.content.trim().length === 0) {
        return CommandResult.failure<ChatMessageResult>("Content is required", ["content"]);
      }

      const message = await this.messageService.createMessage({
        sessionId: command.sessionId,
        senderId: command.senderId,
        senderType: ChatSenderType.fromString(command.senderType),
        content: command.content,
        messageType: command.messageType,
        metadata: command.metadata,
        isAutomated: command.isAutomated,
      });

      const result: ChatMessageResult = {
        messageId: message.getMessageId().getValue(),
        sessionId: message.getSessionId(),
        senderId: message.getSenderId(),
        senderType: message.getSenderType().getValue(),
        content: message.getContent(),
        messageType: message.getMessageType(),
        isAutomated: message.isAutomatedMessage(),
        createdAt: message.getCreatedAt(),
      };

      return CommandResult.success<ChatMessageResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ChatMessageResult>("Failed to add chat message", [
          error.message,
        ]);
      }

      return CommandResult.failure<ChatMessageResult>(
        "An unexpected error occurred while adding chat message",
      );
    }
  }
}
