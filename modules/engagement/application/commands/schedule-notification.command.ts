import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { NotificationService } from "../services/notification.service";
import { NotificationDTO } from "../../domain/entities/notification.entity";

export interface ScheduleNotificationCommand extends ICommand {
  readonly type: string;
  readonly channel?: string;
  readonly templateId?: string;
  readonly payload?: Record<string, unknown>;
  readonly scheduledAt: Date;
}

export class ScheduleNotificationHandler
  implements ICommandHandler<ScheduleNotificationCommand, CommandResult<NotificationDTO>>
{
  constructor(private readonly notificationService: NotificationService) {}

  async handle(command: ScheduleNotificationCommand): Promise<CommandResult<NotificationDTO>> {
    const dto = await this.notificationService.createNotification({
      type: command.type,
      channel: command.channel,
      templateId: command.templateId,
      payload: command.payload,
      scheduledAt: command.scheduledAt,
    });
    return CommandResult.success(dto);
  }
}
