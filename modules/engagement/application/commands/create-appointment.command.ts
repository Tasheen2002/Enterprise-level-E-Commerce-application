import { AppointmentService } from "../services/appointment.service.js";
import { AppointmentType } from "../../domain/value-objects/index.js";

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

export interface CreateAppointmentCommand extends ICommand {
  userId: string;
  type: string;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export interface AppointmentResult {
  apptId: string;
  userId: string;
  type: string;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export class CreateAppointmentHandler
  implements ICommandHandler<CreateAppointmentCommand, CommandResult<AppointmentResult>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    command: CreateAppointmentCommand
  ): Promise<CommandResult<AppointmentResult>> {
    try {
      if (!command.userId || command.userId.trim().length === 0) {
        return CommandResult.failure<AppointmentResult>(
          "User ID is required",
          ["userId"]
        );
      }

      if (!command.type || command.type.trim().length === 0) {
        return CommandResult.failure<AppointmentResult>(
          "Appointment type is required",
          ["type"]
        );
      }

      if (!command.startAt) {
        return CommandResult.failure<AppointmentResult>(
          "Start date/time is required",
          ["startAt"]
        );
      }

      if (!command.endAt) {
        return CommandResult.failure<AppointmentResult>(
          "End date/time is required",
          ["endAt"]
        );
      }

      if (command.startAt >= command.endAt) {
        return CommandResult.failure<AppointmentResult>(
          "End time must be after start time",
          ["startAt", "endAt"]
        );
      }

      const appointment = await this.appointmentService.createAppointment({
        userId: command.userId,
        type: AppointmentType.fromString(command.type),
        locationId: command.locationId,
        startAt: command.startAt,
        endAt: command.endAt,
        notes: command.notes,
      });

      const result: AppointmentResult = {
        apptId: appointment.getApptId().getValue(),
        userId: appointment.getUserId(),
        type: appointment.getType().getValue(),
        locationId: appointment.getLocationId(),
        startAt: appointment.getStartAt(),
        endAt: appointment.getEndAt(),
        notes: appointment.getNotes(),
      };

      return CommandResult.success<AppointmentResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<AppointmentResult>(
          "Failed to create appointment",
          [error.message]
        );
      }

      return CommandResult.failure<AppointmentResult>(
        "An unexpected error occurred while creating appointment"
      );
    }
  }
}
