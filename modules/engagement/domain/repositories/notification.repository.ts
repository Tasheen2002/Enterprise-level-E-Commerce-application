import { Notification } from "../entities/notification.entity";
import { NotificationId } from "../value-objects";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface NotificationFilters {
  type?: string;
  channel?: string;
  status?: string;
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
    type: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByChannel(
    channel: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>>;
  findByStatus(
    status: string,
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
  countByType(type: string): Promise<number>;
  countByChannel(channel: string): Promise<number>;
  countByStatus(status: string): Promise<number>;
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
