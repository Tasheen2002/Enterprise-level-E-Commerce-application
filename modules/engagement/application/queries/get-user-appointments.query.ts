import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService, PaginatedAppointmentResult } from "../services/appointment.service";

export interface GetUserAppointmentsQuery extends IQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetUserAppointmentsHandler implements IQueryHandler<GetUserAppointmentsQuery, PaginatedAppointmentResult> {
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(query: GetUserAppointmentsQuery): Promise<PaginatedAppointmentResult> {
    return this.appointmentService.getAppointmentsByUser(
      query.userId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
