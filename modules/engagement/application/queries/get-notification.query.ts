import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { NotificationService } from "../services/notification.service";
import { NotificationDTO } from "../../domain/entities/notification.entity";
import { NotificationNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetNotificationQuery extends IQuery {
  readonly notificationId: string;
}

export class GetNotificationHandler implements IQueryHandler<GetNotificationQuery, NotificationDTO> {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(query: GetNotificationQuery): Promise<NotificationDTO> {
    const dto = await this.notificationService.getNotificationById(query.notificationId);
    if (!dto) {
      throw new NotificationNotFoundError(query.notificationId);
    }
    return dto;
  }
}
