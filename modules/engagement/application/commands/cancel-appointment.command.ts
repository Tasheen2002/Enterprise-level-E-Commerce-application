import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService } from "../services/appointment.service";

export interface CancelAppointmentCommand extends ICommand {
  readonly appointmentId: string;
}

export class CancelAppointmentHandler
  implements ICommandHandler<CancelAppointmentCommand, CommandResult<void>>
{
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(command: CancelAppointmentCommand): Promise<CommandResult<void>> {
    await this.appointmentService.cancelAppointment(command.appointmentId);
    return CommandResult.success();
  }
}
