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

export interface GetAppointmentQuery extends IQuery {
  appointmentId: string;
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

export class GetAppointmentHandler
  implements IQueryHandler<GetAppointmentQuery, QueryResult<AppointmentDto | null>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    query: GetAppointmentQuery
  ): Promise<QueryResult<AppointmentDto | null>> {
    try {
      if (!query.appointmentId || query.appointmentId.trim().length === 0) {
        return QueryResult.failure<AppointmentDto | null>(
          "Appointment ID is required",
          ["appointmentId"]
        );
      }

      const appointment = await this.appointmentService.getAppointment(
        query.appointmentId
      );

      if (!appointment) {
        return QueryResult.success<AppointmentDto | null>(null);
      }

      const result: AppointmentDto = {
        apptId: appointment.getApptId().getValue(),
        userId: appointment.getUserId(),
        type: appointment.getType().getValue(),
        locationId: appointment.getLocationId(),
        startAt: appointment.getStartAt(),
        endAt: appointment.getEndAt(),
        notes: appointment.getNotes(),
      };

      return QueryResult.success<AppointmentDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<AppointmentDto | null>(
          "Failed to get appointment",
          [error.message]
        );
      }

      return QueryResult.failure<AppointmentDto | null>(
        "An unexpected error occurred while getting appointment"
      );
    }
  }
}