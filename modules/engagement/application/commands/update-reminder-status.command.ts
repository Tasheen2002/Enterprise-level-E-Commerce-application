import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";

export interface UpdateReminderStatusCommand extends ICommand {
  readonly reminderId: string;
  readonly status: "sent";
}

export class UpdateReminderStatusHandler
  implements ICommandHandler<UpdateReminderStatusCommand, CommandResult<void>>
{
  constructor(private readonly reminderService: ReminderManagementService) {}

  async handle(command: UpdateReminderStatusCommand): Promise<CommandResult<void>> {
    await this.reminderService.markReminderAsSent(command.reminderId);
    return CommandResult.success();
  }
}
