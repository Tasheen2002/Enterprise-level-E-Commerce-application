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

export interface GetVariantRemindersQuery extends IQuery {
  variantId: string;
  limit?: number;
  offset?: number;
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

export class GetVariantRemindersHandler
  implements IQueryHandler<GetVariantRemindersQuery, QueryResult<ReminderDto[]>>
{
  constructor(
    private readonly reminderService: ReminderManagementService
  ) {}

  async handle(
    query: GetVariantRemindersQuery
  ): Promise<QueryResult<ReminderDto[]>> {
    try {
      if (!query.variantId || query.variantId.trim().length === 0) {
        return QueryResult.failure<ReminderDto[]>(
          "Variant ID is required",
          ["variantId"]
        );
      }

      const reminders = await this.reminderService.getRemindersByVariant(
        query.variantId,
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: ReminderDto[] = reminders.map((reminder) => ({
        reminderId: reminder.getReminderId().getValue(),
        type: reminder.getType().getValue(),
        variantId: reminder.getVariantId(),
        userId: reminder.getUserId(),
        contact: reminder.getContact().getValue(),
        channel: reminder.getChannel().getValue(),
        status: reminder.getStatus().getValue(),
        optInAt: reminder.getOptInAt(),
      }));

      return QueryResult.success<ReminderDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReminderDto[]>(
          "Failed to get variant reminders",
          [error.message]
        );
      }

      return QueryResult.failure<ReminderDto[]>(
        "An unexpected error occurred while getting variant reminders"
      );
    }
  }
}
