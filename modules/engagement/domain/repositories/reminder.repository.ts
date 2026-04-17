import { Reminder } from "../entities/reminder.entity";
import {
  ReminderId,
  ReminderType,
  ReminderStatus,
} from "../value-objects";
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
  type?: ReminderType;
  status?: ReminderStatus;
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
    status: ReminderStatus,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>>;
  findByType(
    type: ReminderType,
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
  countByStatus(status: ReminderStatus): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;
  countByType(type: ReminderType): Promise<number>;
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
