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

export interface CancelAppointmentCommand extends ICommand {
  appointmentId: string;
}

export class CancelAppointmentHandler
  implements ICommandHandler<CancelAppointmentCommand, CommandResult<void>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    command: CancelAppointmentCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.appointmentId || command.appointmentId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Appointment ID is required",
          ["appointmentId"]
        );
      }

      await this.appointmentService.cancelAppointment(command.appointmentId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to cancel appointment",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while canceling appointment"
      );
    }
  }
}
