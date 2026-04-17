import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";

export interface UnsubscribeReminderCommand extends ICommand {
  readonly reminderId: string;
}

export class UnsubscribeReminderHandler
  implements ICommandHandler<UnsubscribeReminderCommand, CommandResult<void>>
{
  constructor(private readonly reminderService: ReminderManagementService) {}

  async handle(command: UnsubscribeReminderCommand): Promise<CommandResult<void>> {
    await this.reminderService.unsubscribeReminder(command.reminderId);
    return CommandResult.success();
  }
}
