import { AppointmentService } from "../services/appointment.service.js";

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

export interface UpdateAppointmentCommand extends ICommand {
  appointmentId: string;
  startAt?: Date;
  endAt?: Date;
  notes?: string;
  locationId?: string;
}

export class UpdateAppointmentHandler
  implements ICommandHandler<UpdateAppointmentCommand, CommandResult<void>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    command: UpdateAppointmentCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.appointmentId || command.appointmentId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Appointment ID is required",
          ["appointmentId"]
        );
      }

      // Reschedule if both dates provided
      if (command.startAt && command.endAt) {
        if (command.startAt >= command.endAt) {
          return CommandResult.failure<void>(
            "End time must be after start time",
            ["startAt", "endAt"]
          );
        }

        await this.appointmentService.rescheduleAppointment(
          command.appointmentId,
          command.startAt,
          command.endAt
        );
      } else if (command.startAt || command.endAt) {
        return CommandResult.failure<void>(
          "Both startAt and endAt must be provided to reschedule",
          ["startAt", "endAt"]
        );
      }

      // Update notes if provided
      if (command.notes !== undefined) {
        await this.appointmentService.updateAppointmentNotes(
          command.appointmentId,
          command.notes
        );
      }

      // Update location if provided
      if (command.locationId !== undefined) {
        await this.appointmentService.updateAppointmentLocation(
          command.appointmentId,
          command.locationId
        );
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to update appointment",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating appointment"
      );
    }
  }
}
