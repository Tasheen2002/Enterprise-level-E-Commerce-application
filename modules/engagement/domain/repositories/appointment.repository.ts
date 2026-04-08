import { Appointment } from "../entities/appointment.entity.js";
import {
  AppointmentId,
  AppointmentType,
} from "../value-objects/index.js";

export interface AppointmentQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "startAt" | "endAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AppointmentFilterOptions {
  userId?: string;
  locationId?: string;
  type?: AppointmentType;
  startDate?: Date;
  endDate?: Date;
}

export interface IAppointmentRepository {
  // Basic CRUD
  save(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
  delete(appointmentId: AppointmentId): Promise<void>;

  // Finders
  findById(appointmentId: AppointmentId): Promise<Appointment | null>;
  findByUserId(
    userId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]>;
  findByLocationId(
    locationId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]>;
  findByType(
    type: AppointmentType,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]>;
  findAll(options?: AppointmentQueryOptions): Promise<Appointment[]>;

  // Advanced queries
  findWithFilters(
    filters: AppointmentFilterOptions,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]>;
  findUpcoming(options?: AppointmentQueryOptions): Promise<Appointment[]>;
  findPast(options?: AppointmentQueryOptions): Promise<Appointment[]>;
  findOngoing(options?: AppointmentQueryOptions): Promise<Appointment[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]>;
  findConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<Appointment[]>;

  // Counts and statistics
  countByUserId(userId: string): Promise<number>;
  countByLocationId(locationId: string): Promise<number>;
  countByType(type: AppointmentType): Promise<number>;
  count(filters?: AppointmentFilterOptions): Promise<number>;

  // Existence checks
  exists(appointmentId: AppointmentId): Promise<boolean>;
  existsByUserIdAndTime(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean>;
  hasConflict(userId: string, startAt: Date, endAt: Date): Promise<boolean>;
}
