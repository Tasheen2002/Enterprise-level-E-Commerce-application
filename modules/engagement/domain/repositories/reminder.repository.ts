import { Reminder } from "../entities/reminder.entity.js";
import {
  ReminderId,
  ReminderType,
  ReminderStatus,
} from "../value-objects/index.js";

export interface ReminderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "optInAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ReminderFilterOptions {
  userId?: string;
  variantId?: string;
  type?: ReminderType;
  status?: ReminderStatus;
}

export interface IReminderRepository {
  // Basic CRUD
  save(reminder: Reminder): Promise<void>;
  update(reminder: Reminder): Promise<void>;
  delete(reminderId: ReminderId): Promise<void>;

  // Finders
  findById(reminderId: ReminderId): Promise<Reminder | null>;
  findByUserId(
    userId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]>;
  findByVariantId(
    variantId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]>;
  findByStatus(
    status: ReminderStatus,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]>;
  findByType(
    type: ReminderType,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]>;
  findAll(options?: ReminderQueryOptions): Promise<Reminder[]>;

  // Advanced queries
  findWithFilters(
    filters: ReminderFilterOptions,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]>;
  findPendingReminders(options?: ReminderQueryOptions): Promise<Reminder[]>;
  findByUserIdAndVariantId(
    userId: string,
    variantId: string
  ): Promise<Reminder | null>;

  // Counts and statistics
  countByStatus(status: ReminderStatus): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;
  countByType(type: ReminderType): Promise<number>;
  count(filters?: ReminderFilterOptions): Promise<number>;

  // Existence checks
  exists(reminderId: ReminderId): Promise<boolean>;
  existsByUserIdAndVariantId(
    userId: string,
    variantId: string
  ): Promise<boolean>;
}
