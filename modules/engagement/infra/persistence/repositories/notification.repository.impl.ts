import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  INotificationRepository,
  NotificationQueryOptions,
  NotificationFilters,
} from "../../../domain/repositories/notification.repository";
import { Notification } from "../../../domain/entities/notification.entity";
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  ChannelType,
} from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface NotificationDatabaseRow {
  id: string;
  type: string;
  channel: string | null;
  templateId: string | null;
  payload: Record<string, any>;
  status: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class NotificationRepositoryImpl
  extends PrismaRepository<Notification>
  implements INotificationRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: NotificationDatabaseRow): Notification {
    return Notification.fromPersistence({
      id: NotificationId.fromString(row.id),
      type: NotificationType.fromString(row.type),
      channel: row.channel ? ChannelType.fromString(row.channel) : undefined,
      templateId: row.templateId || undefined,
      payload: row.payload || {},
      status: NotificationStatus.fromString(row.status || "pending"),
      scheduledAt: row.scheduledAt || undefined,
      sentAt: row.sentAt || undefined,
      error: row.error || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(notification: Notification): Promise<void> {
    await this.prisma.notification.upsert({
      where: { id: notification.id.getValue() },
      create: {
        id: notification.id.getValue(),
        type: notification.type.getValue() as any,
        channel: notification.channel?.getValue() as any,
        templateId: notification.templateId,
        payload: notification.payload || {},
        status: notification.status.getValue(),
        scheduledAt: notification.scheduledAt,
        sentAt: notification.sentAt,
        error: notification.error,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
      update: {
        status: notification.status.getValue(),
        sentAt: notification.sentAt,
        error: notification.error,
        updatedAt: notification.updatedAt,
      },
    });
    await this.dispatchEvents(notification);
  }

  async delete(notificationId: NotificationId): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId.getValue() },
    });
  }

  async findById(notificationId: NotificationId): Promise<Notification | null> {
    const record = await this.prisma.notification.findUnique({
      where: { id: notificationId.getValue() },
    });

    return record ? this.toEntity(record as NotificationDatabaseRow) : null;
  }

  async findByType(
    type: NotificationType,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { type: type.getValue() as any };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByChannel(
    channel: ChannelType,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { channel: channel.getValue() as any };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByStatus(
    status: NotificationStatus,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: status.getValue() };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: NotificationFilters,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: any = {};
    if (filters.type) where.type = filters.type.getValue() as any;
    if (filters.channel) where.channel = filters.channel.getValue() as any;
    if (filters.status) where.status = filters.status.getValue();
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findPendingNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "pending" };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findScheduledNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "scheduledAt",
      sortOrder = "asc",
    } = options || {};

    const where = {
      status: "scheduled",
      scheduledAt: { not: null },
    };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as any },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findDueNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "scheduledAt",
      sortOrder = "asc",
    } = options || {};

    const now = new Date();
    const where = {
      status: "scheduled",
      scheduledAt: { lte: now },
    };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as any },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findFailedNotifications(
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<Notification>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "failed" };

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder as any },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NotificationDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async countByType(type: NotificationType): Promise<number> {
    return await this.prisma.notification.count({
      where: { type: type.getValue() as any },
    });
  }

  async countByChannel(channel: ChannelType): Promise<number> {
    return await this.prisma.notification.count({
      where: { channel: channel.getValue() as any },
    });
  }

  async countByStatus(status: NotificationStatus): Promise<number> {
    return await this.prisma.notification.count({
      where: { status: status.getValue() },
    });
  }

  async count(filters?: NotificationFilters): Promise<number> {
    const where: any = {};
    if (filters?.type) where.type = filters.type.getValue() as any;
    if (filters?.channel) where.channel = filters.channel.getValue() as any;
    if (filters?.status) where.status = filters.status.getValue();
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await this.prisma.notification.count({ where });
  }

  async exists(notificationId: NotificationId): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: { id: notificationId.getValue() },
    });

    return count > 0;
  }
}
