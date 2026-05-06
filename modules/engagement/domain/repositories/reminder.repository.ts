import { Reminder } from "../entities/reminder.entity";
import { ReminderId } from "../value-objects";
import { ReminderStatusValue } from "../value-objects/reminder-status.vo";
import { ReminderTypeValue } from "../value-objects/reminder-type.vo";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface ReminderFilters {
  userId?: string;
  variantId?: string;
  type?: ReminderTypeValue;
  status?: ReminderStatusValue;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface IReminderRepository {
  // Basic CRUD
  save(reminder: Reminder): Promise<void>;
  delete(reminderId: ReminderId): Promise<void>;

  // Finders
  findById(reminderId: ReminderId): Promise<Reminder | null>;
  findByUserId(
    userId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findByVariantId(
    variantId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findByStatus(
    status: ReminderStatusValue,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findByType(
    type: ReminderTypeValue,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findAll(options?: ReminderQueryOptions): Promise<PaginatedResult<Reminder>>;

  // Advanced queries
  findWithFilters(
    filters: ReminderFilters,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findPendingReminders(
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findByUserIdAndVariantId(
    userId: string,
    variantId: string,
  ): Promise<Reminder | null>;

  // Counts and statistics
  countByStatus(status: ReminderStatusValue): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;
  countByType(type: ReminderTypeValue): Promise<number>;
  count(filters?: ReminderFilters): Promise<number>;

  // Existence checks
  exists(reminderId: ReminderId): Promise<boolean>;
  existsByUserIdAndVariantId(
    userId: string,
    variantId: string,
  ): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface ReminderQueryOptions extends PaginationOptions {
  sortBy?: "optInAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}
