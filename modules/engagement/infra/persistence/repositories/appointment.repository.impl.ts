import { PrismaClient, AppointmentTypeEnum, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IAppointmentRepository,
  AppointmentQueryOptions,
  AppointmentFilters,
} from "../../../domain/repositories/appointment.repository";
import { Appointment } from "../../../domain/entities/appointment.entity";
import {
  AppointmentId,
  AppointmentType,
} from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface AppointmentDatabaseRow {
  id: string;
  userId: string;
  type: string;
  locationId: string | null;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class AppointmentRepositoryImpl
  extends PrismaRepository<Appointment>
  implements IAppointmentRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: AppointmentDatabaseRow): Appointment {
    return Appointment.fromPersistence({
      id: AppointmentId.fromString(row.id),
      userId: row.userId,
      type: AppointmentType.fromString(row.type),
      locationId: row.locationId || undefined,
      startAt: row.startAt,
      endAt: row.endAt,
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(appointment: Appointment): Promise<void> {
    await this.prisma.appointment.upsert({
      where: { id: appointment.id.getValue() },
      create: {
        id: appointment.id.getValue(),
        userId: appointment.userId,
        type: appointment.type.getValue() as AppointmentTypeEnum,
        locationId: appointment.locationId,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
      update: {
        type: appointment.type.getValue() as AppointmentTypeEnum,
        locationId: appointment.locationId,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        notes: appointment.notes,
      },
    });
    await this.dispatchEvents(appointment);
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

    return record ? this.toEntity(record as AppointmentDatabaseRow) : null;
  }

  async findByUserId(
    userId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByLocationId(
    locationId: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = { locationId };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByType(
    type: string,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = { type: type as AppointmentTypeEnum };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: AppointmentFilters,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where: Prisma.AppointmentWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.locationId ? { locationId: filters.locationId } : {}),
      ...(filters.type ? { type: filters.type as AppointmentTypeEnum } : {}),
      ...((filters.startDate || filters.endDate) ? {
        startAt: {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate ? { lte: filters.endDate } : {}),
        },
      } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findUpcoming(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = { startAt: { gt: new Date() } };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findPast(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = { endAt: { lt: new Date() } };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findOngoing(
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const now = new Date();
    const where = {
      startAt: { lte: now },
      endAt: { gte: now },
    };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: AppointmentQueryOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "startAt",
      sortOrder = "asc",
    } = options || {};

    const where = {
      startAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [records, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as AppointmentDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findConflictingAppointments(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        userId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          {
            AND: [{ startAt: { gte: startAt } }, { startAt: { lt: endAt } }],
          },
          {
            AND: [{ endAt: { gt: startAt } }, { endAt: { lte: endAt } }],
          },
          {
            AND: [{ startAt: { lte: startAt } }, { endAt: { gte: endAt } }],
          },
        ],
      },
    });

    return records.map((record) => this.toEntity(record as AppointmentDatabaseRow));
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

  async countByType(type: string): Promise<number> {
    return await this.prisma.appointment.count({
      where: { type: type as AppointmentTypeEnum },
    });
  }

  async count(filters?: AppointmentFilters): Promise<number> {
    const where: Prisma.AppointmentWhereInput = {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.locationId ? { locationId: filters.locationId } : {}),
      ...(filters?.type ? { type: filters.type as AppointmentTypeEnum } : {}),
      ...((filters?.startDate || filters?.endDate) ? {
        startAt: {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate ? { lte: filters.endDate } : {}),
        },
      } : {}),
    };

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
    endAt: Date,
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
    endAt: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const conflicts = await this.findConflictingAppointments(
      userId,
      startAt,
      endAt,
      excludeId,
    );
    return conflicts.length > 0;
  }
}
