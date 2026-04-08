import { ReminderManagementService } from "../services/reminder-management.service.js";

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

export interface GetReminderQuery extends IQuery {
  reminderId: string;
}

export interface ReminderDto {
  reminderId: string;
  type: string;
  variantId: string;
  userId?: string;
  contact: string;
  channel: string;
  status: string;
  optInAt?: Date;
}

export class GetReminderHandler
  implements IQueryHandler<GetReminderQuery, QueryResult<ReminderDto | null>>
{
  constructor(
    private readonly reminderService: ReminderManagementService
  ) {}

  async handle(
    query: GetReminderQuery
  ): Promise<QueryResult<ReminderDto | null>> {
    try {
      if (!query.reminderId || query.reminderId.trim().length === 0) {
        return QueryResult.failure<ReminderDto | null>(
          "Reminder ID is required",
          ["reminderId"]
        );
      }

      const reminder = await this.reminderService.getReminder(query.reminderId);

      if (!reminder) {
        return QueryResult.success<ReminderDto | null>(null);
      }

      const result: ReminderDto = {
        reminderId: reminder.getReminderId().getValue(),
        type: reminder.getType().getValue(),
        variantId: reminder.getVariantId(),
        userId: reminder.getUserId(),
        contact: reminder.getContact().getValue(),
        channel: reminder.getChannel().getValue(),
        status: reminder.getStatus().getValue(),
        optInAt: reminder.getOptInAt(),
      };

      return QueryResult.success<ReminderDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReminderDto | null>(
          "Failed to get reminder",
          [error.message]
        );
      }

      return QueryResult.failure<ReminderDto | null>(
        "An unexpected error occurred while getting reminder"
      );
    }
  }
}
