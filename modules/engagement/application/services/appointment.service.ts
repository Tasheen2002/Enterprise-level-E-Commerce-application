import {
  IAppointmentRepository,
  AppointmentQueryOptions,
  AppointmentFilterOptions,
} from "../../domain/repositories/appointment.repository.js";
import { Appointment } from "../../domain/entities/appointment.entity.js";
import {
  AppointmentId,
  AppointmentType,
} from "../../domain/value-objects/index.js";

export class AppointmentService {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  async createAppointment(data: {
    userId: string;
    type: AppointmentType;
    locationId?: string;
    startAt: Date;
    endAt: Date;
    notes?: string;
  }): Promise<Appointment> {
    // Check for conflicts
    const hasConflict = await this.appointmentRepository.hasConflict(
      data.userId,
      data.startAt,
      data.endAt
    );

    if (hasConflict) {
      throw new Error(
        "Appointment conflicts with an existing appointment for this user"
      );
    }

    const appointment = Appointment.create({
      userId: data.userId,
      type: data.type,
      locationId: data.locationId,
      startAt: data.startAt,
      endAt: data.endAt,
      notes: data.notes,
    });

    await this.appointmentRepository.save(appointment);
    return appointment;
  }

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    return await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId)
    );
  }

  async rescheduleAppointment(
    appointmentId: string,
    startAt: Date,
    endAt: Date
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId)
    );

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    // Check for conflicts with the new time
    const hasConflict = await this.appointmentRepository.hasConflict(
      appointment.getUserId(),
      startAt,
      endAt
    );

    if (hasConflict) {
      throw new Error(
        "New appointment time conflicts with an existing appointment"
      );
    }

    appointment.reschedule(startAt, endAt);
    await this.appointmentRepository.update(appointment);
  }

  async updateAppointmentNotes(
    appointmentId: string,
    notes?: string
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId)
    );

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    appointment.updateNotes(notes);
    await this.appointmentRepository.update(appointment);
  }

  async updateAppointmentLocation(
    appointmentId: string,
    locationId?: string
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      AppointmentId.fromString(appointmentId)
    );

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    appointment.updateLocation(locationId);
    await this.appointmentRepository.update(appointment);
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const exists = await this.appointmentRepository.exists(
      AppointmentId.fromString(appointmentId)
    );

    if (!exists) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    await this.appointmentRepository.delete(
      AppointmentId.fromString(appointmentId)
    );
  }

  async getAppointmentsByUser(
    userId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findByUserId(userId, options);
  }

  async getAppointmentsByLocation(
    locationId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findByLocationId(
      locationId,
      options
    );
  }

  async getAppointmentsByType(
    type: AppointmentType,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findByType(type, options);
  }

  async getUpcomingAppointments(
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findUpcoming(options);
  }

  async getPastAppointments(
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findPast(options);
  }

  async getOngoingAppointments(
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findOngoing(options);
  }

  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findByDateRange(
      startDate,
      endDate,
      options
    );
  }

  async getConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findConflictingAppointments(
      userId,
      startAt,
      endAt
    );
  }

  async getAppointmentsWithFilters(
    filters: AppointmentFilterOptions,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findWithFilters(filters, options);
  }

  async getAllAppointments(
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    return await this.appointmentRepository.findAll(options);
  }

  async countAppointments(
    filters?: AppointmentFilterOptions
  ): Promise<number> {
    return await this.appointmentRepository.count(filters);
  }

  async countAppointmentsByUser(userId: string): Promise<number> {
    return await this.appointmentRepository.countByUserId(userId);
  }

  async countAppointmentsByLocation(locationId: string): Promise<number> {
    return await this.appointmentRepository.countByLocationId(locationId);
  }

  async countAppointmentsByType(type: AppointmentType): Promise<number> {
    return await this.appointmentRepository.countByType(type);
  }

  async appointmentExists(appointmentId: string): Promise<boolean> {
    return await this.appointmentRepository.exists(
      AppointmentId.fromString(appointmentId)
    );
  }

  async hasConflict(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    return await this.appointmentRepository.hasConflict(userId, startAt, endAt);
  }

  async hasAppointmentAtTime(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    return await this.appointmentRepository.existsByUserIdAndTime(
      userId,
      startAt,
      endAt
    );
  }
}
