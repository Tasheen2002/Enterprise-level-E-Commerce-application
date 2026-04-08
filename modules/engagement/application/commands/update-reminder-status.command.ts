import { ReminderManagementService } from "../services/reminder-management.service.js";

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

export interface UpdateReminderStatusCommand extends ICommand {
  reminderId: string;
  status: "sent";
}

export class UpdateReminderStatusHandler
  implements ICommandHandler<UpdateReminderStatusCommand, CommandResult<void>>
{
  constructor(
    private readonly reminderService: ReminderManagementService
  ) {}

  async handle(
    command: UpdateReminderStatusCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.reminderId || command.reminderId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Reminder ID is required",
          ["reminderId"]
        );
      }

      if (!command.status) {
        return CommandResult.failure<void>(
          "Status is required",
          ["status"]
        );
      }

      if (command.status === "sent") {
        await this.reminderService.markReminderAsSent(command.reminderId);
      } else {
        return CommandResult.failure<void>(
          "Invalid status value",
          ["status"]
        );
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to update reminder status",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating reminder status"
      );
    }
  }
}
