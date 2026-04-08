import { NotificationService } from "../services/notification.service.js";

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

export interface SendNotificationCommand extends ICommand {
  notificationId: string;
}

export class SendNotificationHandler
  implements ICommandHandler<SendNotificationCommand, CommandResult<void>>
{
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async handle(
    command: SendNotificationCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.notificationId || command.notificationId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Notification ID is required",
          ["notificationId"]
        );
      }

      await this.notificationService.markNotificationAsSent(command.notificationId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to send notification",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while sending notification"
      );
    }
  }
}
