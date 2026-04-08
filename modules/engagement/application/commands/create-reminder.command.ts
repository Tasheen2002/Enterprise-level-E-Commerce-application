import { ReminderManagementService } from "../services/reminder-management.service.js";
import {
  ReminderType,
  ContactType,
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

export interface CreateReminderCommand extends ICommand {
  type: string;
  variantId: string;
  userId?: string;
  contact: string;
  channel: string;
  optInAt?: Date;
}

export interface ReminderResult {
  reminderId: string;
  type: string;
  variantId: string;
  userId?: string;
  contact: string;
  channel: string;
  status: string;
  optInAt?: Date;
}

export class CreateReminderHandler
  implements ICommandHandler<CreateReminderCommand, CommandResult<ReminderResult>>
{
  constructor(
    private readonly reminderService: ReminderManagementService
  ) {}

  async handle(
    command: CreateReminderCommand
  ): Promise<CommandResult<ReminderResult>> {
    try {
      if (!command.type || command.type.trim().length === 0) {
        return CommandResult.failure<ReminderResult>(
          "Reminder type is required",
          ["type"]
        );
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        return CommandResult.failure<ReminderResult>(
          "Variant ID is required",
          ["variantId"]
        );
      }

      if (!command.contact || command.contact.trim().length === 0) {
        return CommandResult.failure<ReminderResult>(
          "Contact is required",
          ["contact"]
        );
      }

      if (!command.channel || command.channel.trim().length === 0) {
        return CommandResult.failure<ReminderResult>(
          "Channel is required",
          ["channel"]
        );
      }

      const reminder = await this.reminderService.createReminder({
        type: ReminderType.fromString(command.type),
        variantId: command.variantId,
        userId: command.userId,
        contact: ContactType.fromString(command.contact),
        channel: ChannelType.fromString(command.channel),
        optInAt: command.optInAt,
      });

      const result: ReminderResult = {
        reminderId: reminder.getReminderId().getValue(),
        type: reminder.getType().getValue(),
        variantId: reminder.getVariantId(),
        userId: reminder.getUserId(),
        contact: reminder.getContact().getValue(),
        channel: reminder.getChannel().getValue(),
        status: reminder.getStatus().getValue(),
        optInAt: reminder.getOptInAt(),
      };

      return CommandResult.success<ReminderResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ReminderResult>(
          "Failed to create reminder",
          [error.message]
        );
      }

      return CommandResult.failure<ReminderResult>(
        "An unexpected error occurred while creating reminder"
      );
    }
  }
}
