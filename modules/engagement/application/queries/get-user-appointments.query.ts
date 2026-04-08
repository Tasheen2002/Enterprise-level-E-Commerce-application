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

export interface GetUserAppointmentsQuery extends IQuery {
  userId: string;
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

export class GetUserAppointmentsHandler
  implements IQueryHandler<GetUserAppointmentsQuery, QueryResult<AppointmentDto[]>>
{
  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  async handle(
    query: GetUserAppointmentsQuery
  ): Promise<QueryResult<AppointmentDto[]>> {
    try {
      if (!query.userId || query.userId.trim().length === 0) {
        return QueryResult.failure<AppointmentDto[]>(
          "User ID is required",
          ["userId"]
        );
      }

      const appointments = await this.appointmentService.getAppointmentsByUser(
        query.userId,
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
          "Failed to get user appointments",
          [error.message]
        );
      }

      return QueryResult.failure<AppointmentDto[]>(
        "An unexpected error occurred while getting user appointments"
      );
    }
  }
}
