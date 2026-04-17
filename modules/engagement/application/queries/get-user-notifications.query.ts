import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { NotificationService, PaginatedNotificationResult } from "../services/notification.service";

export interface GetUserNotificationsQuery extends IQuery {
  readonly type: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetUserNotificationsHandler implements IQueryHandler<GetUserNotificationsQuery, PaginatedNotificationResult> {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(query: GetUserNotificationsQuery): Promise<PaginatedNotificationResult> {
    return this.notificationService.getNotificationsByType(
      query.type,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
