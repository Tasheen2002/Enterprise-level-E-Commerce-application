import {
  INotificationRepository,
  NotificationQueryOptions,
  NotificationFilterOptions,
} from "../../domain/repositories/notification.repository.js";
import { Notification } from "../../domain/entities/notification.entity.js";
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  ChannelType,
} from "../../domain/value-objects/index.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async createNotification(data: {
    type: NotificationType;
    channel?: ChannelType;
    templateId?: string;
    payload?: Record<string, any>;
    scheduledAt?: Date;
  }): Promise<Notification> {
    const notification = Notification.create({
      type: data.type,
      channel: data.channel,
      templateId: data.templateId,
      payload: data.payload,
      scheduledAt: data.scheduledAt,
    });

    await this.notificationRepository.save(notification);
    return notification;
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    return await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );
  }

  async updateNotificationPayload(
    notificationId: string,
    payload: Record<string, any>
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.updatePayload(payload);
    await this.notificationRepository.update(notification);
  }

  async scheduleNotification(
    notificationId: string,
    scheduledAt: Date
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.schedule(scheduledAt);
    await this.notificationRepository.update(notification);
  }

  async markNotificationAsSending(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.markAsSending();
    await this.notificationRepository.update(notification);
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.markAsSent();
    await this.notificationRepository.update(notification);
  }

  async markNotificationAsFailed(
    notificationId: string,
    error: string
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.markAsFailed(error);
    await this.notificationRepository.update(notification);
  }

  async retryNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      NotificationId.fromString(notificationId)
    );

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    notification.retry();
    await this.notificationRepository.update(notification);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const exists = await this.notificationRepository.exists(
      NotificationId.fromString(notificationId)
    );

    if (!exists) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    await this.notificationRepository.delete(
      NotificationId.fromString(notificationId)
    );
  }

  async getNotificationsByType(
    type: NotificationType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findByType(type, options);
  }

  async getNotificationsByChannel(
    channel: ChannelType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findByChannel(channel, options);
  }

  async getNotificationsByStatus(
    status: NotificationStatus,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findByStatus(status, options);
  }

  async getPendingNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findPendingNotifications(options);
  }

  async getScheduledNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findScheduledNotifications(
      options
    );
  }

  async getDueNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findDueNotifications(options);
  }

  async getFailedNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findFailedNotifications(options);
  }

  async getNotificationsWithFilters(
    filters: NotificationFilterOptions,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findWithFilters(filters, options);
  }

  async getAllNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    return await this.notificationRepository.findAll(options);
  }

  async countNotifications(
    filters?: NotificationFilterOptions
  ): Promise<number> {
    return await this.notificationRepository.count(filters);
  }

  async countNotificationsByType(type: NotificationType): Promise<number> {
    return await this.notificationRepository.countByType(type);
  }

  async countNotificationsByChannel(channel: ChannelType): Promise<number> {
    return await this.notificationRepository.countByChannel(channel);
  }

  async countNotificationsByStatus(
    status: NotificationStatus
  ): Promise<number> {
    return await this.notificationRepository.countByStatus(status);
  }

  async notificationExists(notificationId: string): Promise<boolean> {
    return await this.notificationRepository.exists(
      NotificationId.fromString(notificationId)
    );
  }
}
