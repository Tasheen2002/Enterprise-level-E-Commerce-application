import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { AppointmentService, PaginatedAppointmentResult } from "../services/appointment.service";

export interface GetLocationAppointmentsQuery extends IQuery {
  readonly locationId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetLocationAppointmentsHandler implements IQueryHandler<GetLocationAppointmentsQuery, PaginatedAppointmentResult> {
  constructor(private readonly appointmentService: AppointmentService) {}

  async handle(query: GetLocationAppointmentsQuery): Promise<PaginatedAppointmentResult> {
    return this.appointmentService.getAppointmentsByLocation(
      query.locationId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
