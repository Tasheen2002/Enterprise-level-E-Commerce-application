import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";

export interface MarkReminderAsSentCommand extends ICommand {
  readonly reminderId: string;
}

export class MarkReminderAsSentHandler
  implements ICommandHandler<MarkReminderAsSentCommand, CommandResult<void>>
{
  constructor(private readonly reminderService: ReminderManagementService) {}

  async handle(command: MarkReminderAsSentCommand): Promise<CommandResult<void>> {
    await this.reminderService.markReminderAsSent(command.reminderId);
    return CommandResult.success();
  }
}
