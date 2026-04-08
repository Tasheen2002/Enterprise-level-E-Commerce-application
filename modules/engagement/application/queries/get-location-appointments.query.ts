import { AppointmentService } from "../services/appointment.service.js";

export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): QueryResult<T> {
    return new QueryResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): QueryResult<T> {
    return new QueryResult<T>(false, undefined, error, errors);
  }
}

export interface GetLocationAppointmentsQuery extends IQuery {
  locationId: string;
  limit?: number;
  offset?: number;
}

export interface AppointmentDto {
  apptId: string;
  userId: string;
  type: string;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export class GetLocationAppointmentsHandler
  implements IQueryHandler<GetLocationAppointmentsQuery, QueryResult<AppointmentDto[]>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    query: GetLocationAppointmentsQuery
  ): Promise<QueryResult<AppointmentDto[]>> {
    try {
      if (!query.locationId || query.locationId.trim().length === 0) {
        return QueryResult.failure<AppointmentDto[]>(
          "Location ID is required",
          ["locationId"]
        );
      }

      const appointments = await this.appointmentService.getAppointmentsByLocation(
        query.locationId,
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: AppointmentDto[] = appointments.map((appointment) => ({
        apptId: appointment.getApptId().getValue(),
        userId: appointment.getUserId(),
        type: appointment.getType().getValue(),
        locationId: appointment.getLocationId(),
        startAt: appointment.getStartAt(),
        endAt: appointment.getEndAt(),
        notes: appointment.getNotes(),
      }));

      return QueryResult.success<AppointmentDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<AppointmentDto[]>(
          "Failed to get location appointments",
          [error.message]
        );
      }

      return QueryResult.failure<AppointmentDto[]>(
        "An unexpected error occurred while getting location appointments"
      );
    }
  }
}
