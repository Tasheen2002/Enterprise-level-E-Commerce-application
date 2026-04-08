import { NotificationService } from "../services/notification.service.js";

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

export interface GetNotificationQuery extends IQuery {
  notificationId: string;
}

export interface NotificationDto {
  notificationId: string;
  type: string;
  channel?: string;
  templateId?: string;
  payload: Record<string, any>;
  status: string;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
}

export class GetNotificationHandler
  implements IQueryHandler<GetNotificationQuery, QueryResult<NotificationDto | null>>
{
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async handle(
    query: GetNotificationQuery
  ): Promise<QueryResult<NotificationDto | null>> {
    try {
      if (!query.notificationId || query.notificationId.trim().length === 0) {
        return QueryResult.failure<NotificationDto | null>(
          "Notification ID is required",
          ["notificationId"]
        );
      }

      const notification = await this.notificationService.getNotification(
        query.notificationId
      );

      if (!notification) {
        return QueryResult.success<NotificationDto | null>(null);
      }

      const result: NotificationDto = {
        notificationId: notification.getNotificationId().getValue(),
        type: notification.getType().getValue(),
        channel: notification.getChannel()?.getValue(),
        templateId: notification.getTemplateId(),
        payload: notification.getPayload(),
        status: notification.getStatus().getValue(),
        scheduledAt: notification.getScheduledAt(),
        sentAt: notification.getSentAt(),
        error: notification.getError(),
      };

      return QueryResult.success<NotificationDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<NotificationDto | null>(
          "Failed to get notification",
          [error.message]
        );
      }

      return QueryResult.failure<NotificationDto | null>(
        "An unexpected error occurred while getting notification"
      );
    }
  }
}
