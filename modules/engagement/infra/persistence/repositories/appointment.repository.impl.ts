import { PrismaClient } from "@prisma/client";
import {
  IAppointmentRepository,
  AppointmentQueryOptions,
  AppointmentFilterOptions,
} from "../../../domain/repositories/appointment.repository.js";
import { Appointment } from "../../../domain/entities/appointment.entity.js";
import {
  AppointmentId,
  AppointmentType,
} from "../../../domain/value-objects/index.js";

export class AppointmentRepositoryImpl implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): Appointment {
    return Appointment.fromDatabaseRow({
      appt_id: record.id,
      user_id: record.userId,
      type: record.type,
      location_id: record.locationId,
      start_at: record.startAt,
      end_at: record.endAt,
      notes: record.notes,
    });
  }

  private dehydrate(appointment: Appointment): any {
    const row = appointment.toDatabaseRow();
    return {
      id: row.appt_id,
      userId: row.user_id,
      type: row.type,
      locationId: row.location_id,
      startAt: row.start_at,
      endAt: row.end_at,
      notes: row.notes,
    };
  }

  private buildOrderBy(options?: AppointmentQueryOptions): any {
    if (!options?.sortBy) {
      return { startAt: "asc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(appointment: Appointment): Promise<void> {
    const data = this.dehydrate(appointment);
    await this.prisma.appointment.create({ data });
  }

  async update(appointment: Appointment): Promise<void> {
    const data = this.dehydrate(appointment);
    const { id, ...updateData } = data;
    await this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(appointmentId: AppointmentId): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id: appointmentId.getValue() },
    });
  }

  async findById(appointmentId: AppointmentId): Promise<Appointment | null> {
    const record = await this.prisma.appointment.findUnique({
      where: { id: appointmentId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByLocationId(
    locationId: string,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { locationId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByType(
    type: AppointmentType,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { type: type.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: AppointmentQueryOptions): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: AppointmentFilterOptions,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.startDate || filters.endDate) {
      where.startAt = {};
      if (filters.startDate) {
        where.startAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.appointment.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUpcoming(options?: AppointmentQueryOptions): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        startAt: {
          gt: new Date(),
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPast(options?: AppointmentQueryOptions): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        endAt: {
          lt: new Date(),
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findOngoing(options?: AppointmentQueryOptions): Promise<Appointment[]> {
    const now = new Date();
    const records = await this.prisma.appointment.findMany({
      where: {
        startAt: {
          lte: now,
        },
        endAt: {
          gte: now,
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startAt: { gte: startAt } },
              { startAt: { lt: endAt } },
            ],
          },
          {
            AND: [
              { endAt: { gt: startAt } },
              { endAt: { lte: endAt } },
            ],
          },
          {
            AND: [
              { startAt: { lte: startAt } },
              { endAt: { gte: endAt } },
            ],
          },
        ],
      },
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.appointment.count({
      where: { userId },
    });
  }

  async countByLocationId(locationId: string): Promise<number> {
    return await this.prisma.appointment.count({
      where: { locationId },
    });
  }

  async countByType(type: AppointmentType): Promise<number> {
    return await this.prisma.appointment.count({
      where: { type: type.getValue() as any },
    });
  }

  async count(filters?: AppointmentFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.appointment.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.startDate || filters.endDate) {
      where.startAt = {};
      if (filters.startDate) {
        where.startAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startAt.lte = filters.endDate;
      }
    }

    return await this.prisma.appointment.count({ where });
  }

  async exists(appointmentId: AppointmentId): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { id: appointmentId.getValue() },
    });

    return count > 0;
  }

  async existsByUserIdAndTime(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        userId,
        startAt,
        endAt,
      },
    });

    return count > 0;
  }

  async hasConflict(
    userId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    const conflicts = await this.findConflictingAppointments(userId, startAt, endAt);
    return conflicts.length > 0;
  }
}
