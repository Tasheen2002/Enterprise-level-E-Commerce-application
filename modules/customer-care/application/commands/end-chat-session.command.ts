import { ChatSessionService } from "../services/chat-session.service.js";

// Base interfaces
export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

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
        return CommandResult.failure<void>("Session ID is required", [
          "sessionId",
        ]);
      }

      await this.chatSessionService.endSession(command.sessionId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to end chat session", [
          error.message,
        ]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while ending chat session"
      );
    }
  }
}
