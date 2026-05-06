import { Notification } from "../entities/notification.entity";
import { NotificationId } from "../value-objects";
import { NotificationTypeValue } from "../value-objects/notification-type.vo";
import { ChannelTypeValue } from "../value-objects/channel-type.vo";
import { NotificationStatusValue } from "../value-objects/notification-status.vo";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface NotificationFilters {
  type?: NotificationTypeValue;
  channel?: ChannelTypeValue;
  status?: NotificationStatusValue;
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
    type: NotificationTypeValue,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByChannel(
    channel: ChannelTypeValue,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByStatus(
    status: NotificationStatusValue,
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
  countByType(type: NotificationTypeValue): Promise<number>;
  countByChannel(channel: ChannelTypeValue): Promise<number>;
  countByStatus(status: NotificationStatusValue): Promise<number>;
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
