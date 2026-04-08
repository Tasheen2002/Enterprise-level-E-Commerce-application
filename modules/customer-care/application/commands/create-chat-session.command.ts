import { ChatSessionService } from "../services/chat-session.service.js";
import { TicketPriority } from "../../domain/value-objects/index.js";

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
  implements
    ICommandHandler<CreateChatSessionCommand, CommandResult<ChatSessionResult>>
{
  constructor(private readonly chatSessionService: ChatSessionService) {}

  async handle(
    command: CreateChatSessionCommand
  ): Promise<CommandResult<ChatSessionResult>> {
    try {
      const session = await this.chatSessionService.createSession({
        userId: command.userId,
        topic: command.topic,
        priority: command.priority
          ? TicketPriority.fromString(command.priority)
          : undefined,
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
        return CommandResult.failure<ChatSessionResult>(
          "Failed to create chat session",
          [error.message]
        );
      }

      return CommandResult.failure<ChatSessionResult>(
        "An unexpected error occurred while creating chat session"
      );
    }
  }
}
