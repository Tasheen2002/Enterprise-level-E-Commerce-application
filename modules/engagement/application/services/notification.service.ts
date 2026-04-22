import {
  INotificationRepository,
  NotificationQueryOptions,
  NotificationFilters,
} from "../../domain/repositories/notification.repository";
import {
  Notification,
  NotificationDTO,
} from "../../domain/entities/notification.entity";
import {
  NotificationId,
  NotificationType,
  ChannelType,
} from "../../domain/value-objects";
import { NotificationNotFoundError } from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedNotificationResult {
  items: NotificationDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async createNotification(data: {
    type: string;
    channel?: string;
    templateId?: string;
    payload?: Record<string, unknown>;
    scheduledAt?: Date;
  }): Promise<NotificationDTO> {
    const notification = Notification.create({
      type: NotificationType.fromString(data.type),
      channel: data.channel ? ChannelType.fromString(data.channel) : undefined,
      templateId: data.templateId,
      payload: data.payload ?? {},
      scheduledAt: data.scheduledAt,
    });

    await this.notificationRepository.save(notification);
    return Notification.toDTO(notification);
  }

  async getNotificationById(notificationId: string): Promise<NotificationDTO | null> {
    const entity = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    return entity ? Notification.toDTO(entity) : null;
  }

  async updateNotificationPayload(
    notificationId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.updatePayload(payload);
    await this.notificationRepository.save(notification);
  }

  async scheduleNotification(notificationId: string, scheduledAt: Date): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.schedule(scheduledAt);
    await this.notificationRepository.save(notification);
  }

  async markNotificationAsSending(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.markAsSending();
    await this.notificationRepository.save(notification);
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.markAsSent();
    await this.notificationRepository.save(notification);
  }

  async markNotificationAsFailed(notificationId: string, error: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.markAsFailed(error);
    await this.notificationRepository.save(notification);
  }

  async retryNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    notification.retry();
    await this.notificationRepository.save(notification);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId),
    );
    if (!notification) throw new NotificationNotFoundError(notificationId);
    await this.notificationRepository.delete(notification.id);
  }

  async getNotificationsByType(
    type: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findByType(type, options);
    return this.mapPaginated(result);
  }

  async getNotificationsByChannel(
    channel: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findByChannel(channel, options);
    return this.mapPaginated(result);
  }

  async getNotificationsByStatus(
    status: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findByStatus(status, options);
    return this.mapPaginated(result);
  }

  async getPendingNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findPendingNotifications(options);
    return this.mapPaginated(result);
  }

  async getScheduledNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findScheduledNotifications(options);
    return this.mapPaginated(result);
  }

  async getDueNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findDueNotifications(options);
    return this.mapPaginated(result);
  }

  async getFailedNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findFailedNotifications(options);
    return this.mapPaginated(result);
  }

  async getNotificationsWithFilters(
    filters: NotificationFilters,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findWithFilters(filters, options);
    return this.mapPaginated(result);
  }

  async getAllNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedNotificationResult> {
    const result = await this.notificationRepository.findAll(options);
    return this.mapPaginated(result);
  }

  async countNotifications(filters?: NotificationFilters): Promise<number> {
    return this.notificationRepository.count(filters);
  }

  async countNotificationsByType(type: string): Promise<number> {
    return this.notificationRepository.countByType(type);
  }

  async countNotificationsByChannel(channel: string): Promise<number> {
    return this.notificationRepository.countByChannel(channel);
  }

  async countNotificationsByStatus(status: string): Promise<number> {
    return this.notificationRepository.countByStatus(status);
  }

  async notificationExists(notificationId: string): Promise<boolean> {
    return this.notificationRepository.exists(NotificationId.fromString(notificationId));
  }

  private mapPaginated(result: PaginatedResult<Notification>): PaginatedNotificationResult {
    return {
      items: result.items.map(Notification.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
