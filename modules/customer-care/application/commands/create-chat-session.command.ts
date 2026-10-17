import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ChatSessionService } from "../services/chat-session.service.js";
import { TicketPriority } from "../../domain/value-objects/index.js";

export interface CreateChatSessionCommand extends ICommand {
  userId?: string;
  topic?: string;
  priority?: string;
}

export interface ChatSessionResult {
  sessionId: string;
  userId?: string;
  topic?: string;
  priority?: string;
  status: string;
  createdAt: Date;
}

export class CreateChatSessionHandler
  implements ICommandHandler<CreateChatSessionCommand, CommandResult<ChatSessionResult>>
{
  constructor(private readonly chatSessionService: ChatSessionService) {}

  async handle(command: CreateChatSessionCommand): Promise<CommandResult<ChatSessionResult>> {
    try {
      const session = await this.chatSessionService.createSession({
        userId: command.userId,
        topic: command.topic,
        priority: command.priority ? TicketPriority.fromString(command.priority) : undefined,
      });

      const result: ChatSessionResult = {
        sessionId: session.getSessionId().getValue(),
        userId: session.getUserId(),
        topic: session.getTopic(),
        priority: session.getPriority()?.getValue(),
        status: session.getStatus()?.getValue() ?? "unknown",
        createdAt: session.getStartedAt(),
      };

      return CommandResult.success<ChatSessionResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ChatSessionResult>("Failed to create chat session", [
          error.message,
        ]);
      }

      return CommandResult.failure<ChatSessionResult>(
        "An unexpected error occurred while creating chat session",
      );
    }
  }
}
