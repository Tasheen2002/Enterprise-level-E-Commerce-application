import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { NotificationService } from "../services/notification.service";

export interface SendNotificationCommand extends ICommand {
  readonly notificationId: string;
}

export class SendNotificationHandler
  implements ICommandHandler<SendNotificationCommand, CommandResult<void>>
{
  constructor(private readonly notificationService: NotificationService) {}

  async handle(command: SendNotificationCommand): Promise<CommandResult<void>> {
    await this.notificationService.markNotificationAsSent(command.notificationId);
    return CommandResult.success();
  }
}
