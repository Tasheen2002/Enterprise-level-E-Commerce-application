import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService } from "../services/appointment.service";
import { AppointmentDTO } from "../../domain/entities/appointment.entity";
import { AppointmentNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetAppointmentQuery extends IQuery {
  readonly appointmentId: string;
}

export class GetAppointmentHandler implements IQueryHandler<GetAppointmentQuery, AppointmentDTO> {
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(query: GetAppointmentQuery): Promise<AppointmentDTO> {
    const dto = await this.appointmentService.getAppointmentById(query.appointmentId);
    if (!dto) {
      throw new AppointmentNotFoundError(query.appointmentId);
    }
    return dto;
  }
}