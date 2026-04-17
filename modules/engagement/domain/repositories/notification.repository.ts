import { Notification } from "../entities/notification.entity";
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  ChannelType,
} from "../value-objects";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface NotificationFilters {
  type?: NotificationType;
  channel?: ChannelType;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface INotificationRepository {
  // Basic CRUD
  save(notification: Notification): Promise<void>;
  delete(notificationId: NotificationId): Promise<void>;

  // Finders
  findById(notificationId: NotificationId): Promise<Notification | null>;
  findByType(
    type: NotificationType,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByChannel(
    channel: ChannelType,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByStatus(
    status: NotificationStatus,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findAll(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;

  // Advanced queries
  findWithFilters(
    filters: NotificationFilters,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findPendingNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findScheduledNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findDueNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findFailedNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;

  // Counts and statistics
  countByType(type: NotificationType): Promise<number>;
  countByChannel(channel: ChannelType): Promise<number>;
  countByStatus(status: NotificationStatus): Promise<number>;
  count(filters?: NotificationFilters): Promise<number>;

  // Existence checks
  exists(notificationId: NotificationId): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface NotificationQueryOptions extends PaginationOptions {
  sortBy?: "scheduledAt" | "sentAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}
