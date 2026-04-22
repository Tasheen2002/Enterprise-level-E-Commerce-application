import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { NotificationService, PaginatedNotificationResult } from "../services/notification.service";

export interface GetNotificationsByTypeQuery extends IQuery {
  readonly type: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetNotificationsByTypeHandler implements IQueryHandler<GetNotificationsByTypeQuery, PaginatedNotificationResult> {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(query: GetNotificationsByTypeQuery): Promise<PaginatedNotificationResult> {
    return this.notificationService.getNotificationsByType(
      query.type,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
