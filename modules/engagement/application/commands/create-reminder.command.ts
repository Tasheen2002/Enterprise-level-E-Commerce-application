import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";
import { ReminderDTO } from "../../domain/entities/reminder.entity";

export interface CreateReminderCommand extends ICommand {
  readonly type: string;
  readonly variantId: string;
  readonly userId?: string;
  readonly contact: string;
  readonly channel: string;
  readonly optInAt?: Date;
}

export class CreateReminderHandler
  implements ICommandHandler<CreateReminderCommand, CommandResult<ReminderDTO>>
{
  constructor(private readonly reminderService: ReminderManagementService) {}

  async handle(command: CreateReminderCommand): Promise<CommandResult<ReminderDTO>> {
    const dto = await this.reminderService.createReminder({
      type: command.type,
      variantId: command.variantId,
      userId: command.userId,
      contact: command.contact,
      channel: command.channel,
      optInAt: command.optInAt,
    });
    return CommandResult.success(dto);
  }
}
