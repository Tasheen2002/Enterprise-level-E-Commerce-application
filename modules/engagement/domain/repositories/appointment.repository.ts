import { Appointment } from "../entities/appointment.entity";
import { AppointmentId } from "../value-objects";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface AppointmentFilters {
  userId?: string;
  locationId?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface IAppointmentRepository {
  // Basic CRUD
  save(appointment: Appointment): Promise<void>;
  delete(appointmentId: AppointmentId): Promise<void>;

  // Finders
  findById(appointmentId: AppointmentId): Promise<Appointment | null>;
  findByUserId(
    userId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findByLocationId(
    locationId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findByType(
    type: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findAll(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;

  // Advanced queries
  findWithFilters(
    filters: AppointmentFilters,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findUpcoming(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findPast(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findOngoing(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>>;
  findConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]>; // Conflicts return raw array as it's usually small and for validation

  // Counts and statistics
  countByUserId(userId: string): Promise<number>;
  countByLocationId(locationId: string): Promise<number>;
  countByType(type: string): Promise<number>;
  count(filters?: AppointmentFilters): Promise<number>;

  // Existence checks
  exists(appointmentId: AppointmentId): Promise<boolean>;
  existsByUserIdAndTime(
    userId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean>;
  hasConflict(userId: string, startAt: Date, endAt: Date, excludeId?: string): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface AppointmentQueryOptions extends PaginationOptions {
  sortBy?: "startAt" | "endAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}
