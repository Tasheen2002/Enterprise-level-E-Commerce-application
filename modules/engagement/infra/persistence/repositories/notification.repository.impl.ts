import { PrismaClient } from "@prisma/client";
import {
  INotificationRepository,
  NotificationQueryOptions,
  NotificationFilterOptions,
} from "../../../domain/repositories/notification.repository.js";
import { Notification } from "../../../domain/entities/notification.entity.js";
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  ChannelType,
} from "../../../domain/value-objects/index.js";

export class NotificationRepositoryImpl implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): Notification {
    return Notification.fromDatabaseRow({
      notification_id: record.id,
      type: record.type,
      channel: record.channel,
      template_id: record.templateId,
      payload: record.payload,
      status: record.status,
      scheduled_at: record.scheduledAt,
      sent_at: record.sentAt,
      error: record.error,
    });
  }

  private dehydrate(notification: Notification): any {
    const row = notification.toDatabaseRow();
    return {
      id: row.notification_id,
      type: row.type,
      channel: row.channel,
      templateId: row.template_id,
      payload: row.payload,
      status: row.status,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      error: row.error,
    };
  }

  private buildOrderBy(options?: NotificationQueryOptions): any {
    if (!options?.sortBy) {
      return { scheduledAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(notification: Notification): Promise<void> {
    const data = this.dehydrate(notification);
    await this.prisma.notification.create({ data });
  }

  async update(notification: Notification): Promise<void> {
    const data = this.dehydrate(notification);
    const { id, ...updateData } = data;
    await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });
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

    return record ? this.hydrate(record) : null;
  }

  async findByType(
    type: NotificationType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { type: type.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByChannel(
    channel: ChannelType,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { channel: channel.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: NotificationStatus,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: NotificationQueryOptions): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: NotificationFilterOptions,
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.channel) {
      where.channel = filters.channel.getValue() as any;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) {
        where.scheduledAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduledAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.notification.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPendingNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { status: "pending" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findScheduledNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { status: "scheduled" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findDueNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: {
        status: "scheduled",
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findFailedNotifications(
    options?: NotificationQueryOptions
  ): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { status: "failed" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
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
      where: { status: status.getValue() as any },
    });
  }

  async count(filters?: NotificationFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.notification.count();
    }

    const where: any = {};

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.channel) {
      where.channel = filters.channel.getValue() as any;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) {
        where.scheduledAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduledAt.lte = filters.endDate;
      }
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
