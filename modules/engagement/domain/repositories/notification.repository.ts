import { Notification } from "../entities/notification.entity.js";
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  ChannelType,
} from "../value-objects/index.js";

export interface NotificationQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "scheduledAt" | "sentAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface NotificationFilterOptions {
  type?: NotificationType;
  channel?: ChannelType;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface INotificationRepository {
  // Basic CRUD
  save(notification: Notification): Promise<void>;
  update(notification: Notification): Promise<void>;
  delete(notificationId: NotificationId): Promise<void>;

  // Finders
  findById(notificationId: NotificationId): Promise<Notification | null>;
  findByType(
    type: NotificationType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findByChannel(
    channel: ChannelType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findByStatus(
    status: NotificationStatus,
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findAll(options?: NotificationQueryOptions): Promise<Notification[]>;

  // Advanced queries
  findWithFilters(
    filters: NotificationFilterOptions,
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findPendingNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findScheduledNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;
  findDueNotifications(options?: NotificationQueryOptions): Promise<Notification[]>;
  findFailedNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]>;

  // Counts and statistics
  countByType(type: NotificationType): Promise<number>;
  countByChannel(channel: ChannelType): Promise<number>;
  countByStatus(status: NotificationStatus): Promise<number>;
  count(filters?: NotificationFilterOptions): Promise<number>;

  // Existence checks
  exists(notificationId: NotificationId): Promise<boolean>;
}
