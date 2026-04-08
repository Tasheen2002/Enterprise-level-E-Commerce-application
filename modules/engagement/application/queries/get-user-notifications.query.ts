import { NotificationService } from "../services/notification.service.js";
import { NotificationType } from "../../domain/value-objects/index.js";

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

export interface GetUserNotificationsQuery extends IQuery {
  type: string;
  limit?: number;
  offset?: number;
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

export class GetUserNotificationsHandler
  implements IQueryHandler<GetUserNotificationsQuery, QueryResult<NotificationDto[]>>
{
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async handle(
    query: GetUserNotificationsQuery
  ): Promise<QueryResult<NotificationDto[]>> {
    try {
      if (!query.type || query.type.trim().length === 0) {
        return QueryResult.failure<NotificationDto[]>(
          "Notification type is required",
          ["type"]
        );
      }

      const notifications = await this.notificationService.getNotificationsByType(
        NotificationType.fromString(query.type),
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: NotificationDto[] = notifications.map((notification) => ({
        notificationId: notification.getNotificationId().getValue(),
        type: notification.getType().getValue(),
        channel: notification.getChannel()?.getValue(),
        templateId: notification.getTemplateId(),
        payload: notification.getPayload(),
        status: notification.getStatus().getValue(),
        scheduledAt: notification.getScheduledAt(),
        sentAt: notification.getSentAt(),
        error: notification.getError(),
      }));

      return QueryResult.success<NotificationDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<NotificationDto[]>(
          "Failed to get user notifications",
          [error.message]
        );
      }

      return QueryResult.failure<NotificationDto[]>(
        "An unexpected error occurred while getting user notifications"
      );
    }
  }
}
