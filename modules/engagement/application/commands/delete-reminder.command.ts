import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";

export interface DeleteReminderCommand extends ICommand {
  readonly reminderId: string;
}

export class DeleteReminderHandler
  implements ICommandHandler<DeleteReminderCommand, CommandResult<void>>
{
  constructor(private readonly reminderService: ReminderManagementService) {}

  async handle(command: DeleteReminderCommand): Promise<CommandResult<void>> {
    await this.reminderService.deleteReminder(command.reminderId);
    return CommandResult.success();
  }
}
