import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService } from "../services/appointment.service";
import { AppointmentDTO } from "../../domain/entities/appointment.entity";

export interface CreateAppointmentCommand extends ICommand {
  readonly userId: string;
  readonly type: string;
  readonly locationId?: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly notes?: string;
}

export class CreateAppointmentHandler
  implements ICommandHandler<CreateAppointmentCommand, CommandResult<AppointmentDTO>>
{
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(command: CreateAppointmentCommand): Promise<CommandResult<AppointmentDTO>> {
    const dto = await this.appointmentService.createAppointment({
      userId: command.userId,
      type: command.type,
      locationId: command.locationId,
      startAt: command.startAt,
      endAt: command.endAt,
      notes: command.notes,
    });
    return CommandResult.success(dto);
  }
}
