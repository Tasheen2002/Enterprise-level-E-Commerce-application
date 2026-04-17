import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService } from "../services/appointment.service";

export interface UpdateAppointmentCommand extends ICommand {
  readonly appointmentId: string;
  readonly startAt?: Date;
  readonly endAt?: Date;
  readonly notes?: string;
  readonly locationId?: string;
}

export class UpdateAppointmentHandler
  implements ICommandHandler<UpdateAppointmentCommand, CommandResult<void>>
{
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(command: UpdateAppointmentCommand): Promise<CommandResult<void>> {
    if (command.startAt !== undefined && command.endAt !== undefined) {
      await this.appointmentService.rescheduleAppointment(
        command.appointmentId,
        command.startAt,
        command.endAt,
      );
    }
    if (command.notes !== undefined) {
      await this.appointmentService.updateAppointmentNotes(command.appointmentId, command.notes);
    }
    if (command.locationId !== undefined) {
      await this.appointmentService.updateAppointmentLocation(command.appointmentId, command.locationId);
    }
    return CommandResult.success();
  }
}
