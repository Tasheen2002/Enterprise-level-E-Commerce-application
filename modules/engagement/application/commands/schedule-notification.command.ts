import { NotificationService } from "../services/notification.service.js";
import {
  NotificationType,
  ChannelType,
} from "../../domain/value-objects/index.js";

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

export interface ScheduleNotificationCommand extends ICommand {
  type: string;
  channel?: string;
  templateId?: string;
  payload?: Record<string, any>;
  scheduledAt: Date;
}

export interface NotificationResult {
  notificationId: string;
  type: string;
  channel?: string;
  templateId?: string;
  payload: Record<string, any>;
  status: string;
  scheduledAt?: Date;
}

export class ScheduleNotificationHandler
  implements ICommandHandler<ScheduleNotificationCommand, CommandResult<NotificationResult>>
{
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async handle(
    command: ScheduleNotificationCommand
  ): Promise<CommandResult<NotificationResult>> {
    try {
      if (!command.type || command.type.trim().length === 0) {
        return CommandResult.failure<NotificationResult>(
          "Notification type is required",
          ["type"]
        );
      }

      if (!command.scheduledAt) {
        return CommandResult.failure<NotificationResult>(
          "Scheduled date/time is required",
          ["scheduledAt"]
        );
      }

      if (command.scheduledAt <= new Date()) {
        return CommandResult.failure<NotificationResult>(
          "Scheduled time must be in the future",
          ["scheduledAt"]
        );
      }

      const notification = await this.notificationService.createNotification({
        type: NotificationType.fromString(command.type),
        channel: command.channel ? ChannelType.fromString(command.channel) : undefined,
        templateId: command.templateId,
        payload: command.payload,
        scheduledAt: command.scheduledAt,
      });

      const result: NotificationResult = {
        notificationId: notification.getNotificationId().getValue(),
        type: notification.getType().getValue(),
        channel: notification.getChannel()?.getValue(),
        templateId: notification.getTemplateId(),
        payload: notification.getPayload(),
        status: notification.getStatus().getValue(),
        scheduledAt: notification.getScheduledAt(),
      };

      return CommandResult.success<NotificationResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<NotificationResult>(
          "Failed to schedule notification",
          [error.message]
        );
      }

      return CommandResult.failure<NotificationResult>(
        "An unexpected error occurred while scheduling notification"
      );
    }
  }
}
