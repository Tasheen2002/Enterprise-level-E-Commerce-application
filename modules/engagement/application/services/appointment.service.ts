import {
  IAppointmentRepository,
  AppointmentQueryOptions,
  AppointmentFilters,
} from "../../domain/repositories/appointment.repository";
import {
  Appointment,
  AppointmentDTO,
} from "../../domain/entities/appointment.entity";
import { AppointmentId, AppointmentType } from "../../domain/value-objects";
import { AppointmentTypeValue } from "../../domain/value-objects/appointment-type.vo";
import {
  AppointmentNotFoundError,
  AppointmentSchedulingError,
} from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedAppointmentResult {
  items: AppointmentDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class AppointmentService {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async createAppointment(data: {
    userId: string;
    type: string;
    locationId?: string;
    startAt: Date;
    endAt: Date;
    notes?: string;
  }): Promise<AppointmentDTO> {
    const hasConflict = await this.appointmentRepository.hasConflict(
      data.userId,
      data.startAt,
      data.endAt,
    );
    if (hasConflict) {
      throw new AppointmentSchedulingError(
        "conflicts with an existing appointment for this user",
      );
    }

    const appointment = Appointment.create({
      userId: data.userId,
      type: AppointmentType.fromString(data.type),
      locationId: data.locationId,
      startAt: data.startAt,
      endAt: data.endAt,
      notes: data.notes,
    });

    await this.appointmentRepository.save(appointment);
    return Appointment.toDTO(appointment);
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentDTO | null> {
    const entity = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId),
    );
    return entity ? Appointment.toDTO(entity) : null;
  }

  async rescheduleAppointment(
    appointmentId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId),
    );
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);

    const hasConflict = await this.appointmentRepository.hasConflict(
      appointment.userId,
      startAt,
      endAt,
      appointmentId,
    );
    if (hasConflict) {
      throw new AppointmentSchedulingError(
        "new time conflicts with an existing appointment",
      );
    }

    appointment.reschedule(startAt, endAt);
    await this.appointmentRepository.save(appointment);
  }

  async updateAppointmentNotes(appointmentId: string, notes?: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId),
    );
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);
    appointment.updateNotes(notes);
    await this.appointmentRepository.save(appointment);
  }

  async updateAppointmentLocation(appointmentId: string, locationId?: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId),
    );
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);
    appointment.updateLocation(locationId);
    await this.appointmentRepository.save(appointment);
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId),
    );
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);
    // Emit the cancellation event by mutating + saving first so subscribers
    // observe the lifecycle change, then delete the row. The save+delete
    // sequence is intentional: the aggregate is terminal after cancellation.
    appointment.cancel();
    await this.appointmentRepository.save(appointment);
    await this.appointmentRepository.delete(appointment.id);
  }

  async getAppointmentsByUser(
    userId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findByUserId(userId, options);
    return this.mapPaginated(result);
  }

  async getAppointmentsByLocation(
    locationId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findByLocationId(locationId, options);
    return this.mapPaginated(result);
  }

  async getAppointmentsByType(
    type: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findByType(
      type as AppointmentTypeValue,
      options,
    );
    return this.mapPaginated(result);
  }

  async getUpcomingAppointments(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findUpcoming(options);
    return this.mapPaginated(result);
  }

  async getPastAppointments(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findPast(options);
    return this.mapPaginated(result);
  }

  async getOngoingAppointments(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findOngoing(options);
    return this.mapPaginated(result);
  }

  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findByDateRange(
      startDate,
      endDate,
      options,
    );
    return this.mapPaginated(result);
  }

  async getConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<AppointmentDTO[]> {
    const entities = await this.appointmentRepository.findConflictingAppointments(
      userId,
      startAt,
      endAt,
      excludeId,
    );
    return entities.map(Appointment.toDTO);
  }

  async getAppointmentsWithFilters(
    filters: AppointmentFilters,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findWithFilters(filters, options);
    return this.mapPaginated(result);
  }

  async getAllAppointments(options?: AppointmentQueryOptions): Promise<PaginatedAppointmentResult> {
    const result = await this.appointmentRepository.findAll(options);
    return this.mapPaginated(result);
  }

  async countAppointments(filters?: AppointmentFilters): Promise<number> {
    return this.appointmentRepository.count(filters);
  }

  async countAppointmentsByUser(userId: string): Promise<number> {
    return this.appointmentRepository.countByUserId(userId);
  }

  async countAppointmentsByLocation(locationId: string): Promise<number> {
    return this.appointmentRepository.countByLocationId(locationId);
  }

  async countAppointmentsByType(type: string): Promise<number> {
    return this.appointmentRepository.countByType(type as AppointmentTypeValue);
  }

  async appointmentExists(appointmentId: string): Promise<boolean> {
    return this.appointmentRepository.exists(AppointmentId.fromString(appointmentId));
  }

  async hasConflict(userId: string, startAt: Date, endAt: Date, excludeId?: string): Promise<boolean> {
    return this.appointmentRepository.hasConflict(userId, startAt, endAt, excludeId);
  }

  async hasAppointmentAtTime(userId: string, startAt: Date, endAt: Date): Promise<boolean> {
    return this.appointmentRepository.existsByUserIdAndTime(userId, startAt, endAt);
  }

  private mapPaginated(result: PaginatedResult<Appointment>): PaginatedAppointmentResult {
    return {
      items: result.items.map(Appointment.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
