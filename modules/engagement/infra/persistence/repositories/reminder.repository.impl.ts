import { PrismaClient, ReminderTypeEnum, ContactEnum, ChannelEnum, ReminderStatusEnum, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IReminderRepository,
  ReminderQueryOptions,
  ReminderFilters,
} from "../../../domain/repositories/reminder.repository";
import { Reminder } from "../../../domain/entities/reminder.entity";
import {
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
} from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface ReminderDatabaseRow {
  id: string;
  type: string;
  variantId: string;
  userId: string | null;
  contact: string;
  channel: string;
  optInAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class ReminderRepositoryImpl
  extends PrismaRepository<Reminder>
  implements IReminderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: ReminderDatabaseRow): Reminder {
    return Reminder.fromPersistence({
      id: ReminderId.fromString(row.id),
      type: ReminderType.fromString(row.type),
      variantId: row.variantId,
      userId: row.userId || undefined,
      contact: ContactType.fromString(row.contact),
      channel: ChannelType.fromString(row.channel),
      optInAt: row.optInAt || undefined,
      status: ReminderStatus.fromString(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(reminder: Reminder): Promise<void> {
    await this.prisma.reminder.upsert({
      where: { id: reminder.id.getValue() },
      create: {
        id: reminder.id.getValue(),
        type: reminder.type.getValue() as ReminderTypeEnum,
        variantId: reminder.variantId,
        userId: reminder.userId,
        contact: reminder.contact.getValue() as ContactEnum,
        channel: reminder.channel.getValue() as ChannelEnum,
        optInAt: reminder.optInAt,
        status: reminder.status.getValue() as ReminderStatusEnum,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt,
      },
      update: {
        status: reminder.status.getValue() as ReminderStatusEnum,
        optInAt: reminder.optInAt,
      },
    });
    await this.dispatchEvents(reminder);
  }

  async delete(reminderId: ReminderId): Promise<void> {
    await this.prisma.reminder.delete({
      where: { id: reminderId.getValue() },
    });
  }

  async findById(reminderId: ReminderId): Promise<Reminder | null> {
    const record = await this.prisma.reminder.findUnique({
      where: { id: reminderId.getValue() },
    });

    return record ? this.toEntity(record as ReminderDatabaseRow) : null;
  }

  async findByUserId(
    userId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByVariantId(
    variantId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { variantId };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByStatus(
    status: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: status as ReminderStatusEnum };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByType(
    type: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { type: type as ReminderTypeEnum };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(options?: ReminderQueryOptions): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: ReminderFilters,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: Prisma.ReminderWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
      ...(filters.type ? { type: filters.type as ReminderTypeEnum } : {}),
      ...(filters.status ? { status: filters.status as ReminderStatusEnum } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findPendingReminders(
    options?: ReminderQueryOptions,
  ): Promise<PaginatedResult<Reminder>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "pending" as ReminderStatusEnum };

    const [records, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ReminderDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByUserIdAndVariantId(
    userId: string,
    variantId: string,
  ): Promise<Reminder | null> {
    const record = await this.prisma.reminder.findFirst({
      where: { userId, variantId },
    });

    return record ? this.toEntity(record as ReminderDatabaseRow) : null;
  }

  async countByStatus(status: string): Promise<number> {
    return await this.prisma.reminder.count({
      where: { status: status as ReminderStatusEnum },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.reminder.count({
      where: { userId },
    });
  }

  async countByVariantId(variantId: string): Promise<number> {
    return await this.prisma.reminder.count({
      where: { variantId },
    });
  }

  async countByType(type: string): Promise<number> {
    return await this.prisma.reminder.count({
      where: { type: type as ReminderTypeEnum },
    });
  }

  async count(filters?: ReminderFilters): Promise<number> {
    const where: Prisma.ReminderWhereInput = {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.variantId ? { variantId: filters.variantId } : {}),
      ...(filters?.type ? { type: filters.type as ReminderTypeEnum } : {}),
      ...(filters?.status ? { status: filters.status as ReminderStatusEnum } : {}),
    };

    return await this.prisma.reminder.count({ where });
  }

  async exists(reminderId: ReminderId): Promise<boolean> {
    const count = await this.prisma.reminder.count({
      where: { id: reminderId.getValue() },
    });

    return count > 0;
  }

  async existsByUserIdAndVariantId(
    userId: string,
    variantId: string,
  ): Promise<boolean> {
    const count = await this.prisma.reminder.count({
      where: { userId, variantId },
    });

    return count > 0;
  }
}
