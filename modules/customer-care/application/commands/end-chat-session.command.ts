import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ChatSessionService } from "../services/chat-session.service.js";

// Base interfaces

export interface EndChatSessionCommand extends ICommand {
  sessionId: string;
}

export class EndChatSessionHandler
  implements ICommandHandler<EndChatSessionCommand, CommandResult<void>>
{
  constructor(private readonly chatSessionService: ChatSessionService) {}

  async handle(command: EndChatSessionCommand): Promise<CommandResult<void>> {
    try {
      if (!command.sessionId) {
        return CommandResult.failure<void>("Session ID is required", ["sessionId"]);
      }

      await this.chatSessionService.endSession(command.sessionId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to end chat session", [error.message]);
      }
      return CommandResult.failure<void>("An unexpected error occurred while ending chat session");
    }
  }
}
