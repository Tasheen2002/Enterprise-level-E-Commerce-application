import { PrismaClient } from "@prisma/client";
import {
  IReminderRepository,
  ReminderQueryOptions,
  ReminderFilterOptions,
} from "../../../domain/repositories/reminder.repository.js";
import { Reminder } from "../../../domain/entities/reminder.entity.js";
import {
  ReminderId,
  ReminderType,
  ReminderStatus,
} from "../../../domain/value-objects/index.js";

export class ReminderRepositoryImpl implements IReminderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): Reminder {
    return Reminder.fromDatabaseRow({
      reminder_id: record.id,
      type: record.type,
      variant_id: record.variantId,
      user_id: record.userId,
      contact: record.contact,
      channel: record.channel,
      opt_in_at: record.optInAt,
      status: record.status,
    });
  }

  private dehydrate(reminder: Reminder): any {
    const row = reminder.toDatabaseRow();
    return {
      id: row.reminder_id,
      type: row.type,
      variantId: row.variant_id,
      userId: row.user_id,
      contact: row.contact,
      channel: row.channel,
      optInAt: row.opt_in_at,
      status: row.status,
    };
  }

  private buildOrderBy(options?: ReminderQueryOptions): any {
    if (!options?.sortBy) {
      return { optInAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(reminder: Reminder): Promise<void> {
    const data = this.dehydrate(reminder);
    await this.prisma.reminder.create({ data });
  }

  async update(reminder: Reminder): Promise<void> {
    const data = this.dehydrate(reminder);
    const { id, ...updateData } = data;
    await this.prisma.reminder.update({
      where: { id },
      data: updateData,
    });
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

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByVariantId(
    variantId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { variantId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: ReminderStatus,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByType(
    type: ReminderType,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { type: type.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: ReminderQueryOptions): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: ReminderFilterOptions,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.variantId) {
      where.variantId = filters.variantId;
    }

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    const records = await this.prisma.reminder.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPendingReminders(
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { status: "pending" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByUserIdAndVariantId(
    userId: string,
    variantId: string
  ): Promise<Reminder | null> {
    const record = await this.prisma.reminder.findFirst({
      where: {
        userId,
        variantId,
      },
    });

    return record ? this.hydrate(record) : null;
  }

  async countByStatus(status: ReminderStatus): Promise<number> {
    return await this.prisma.reminder.count({
      where: { status: status.getValue() as any },
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

  async countByType(type: ReminderType): Promise<number> {
    return await this.prisma.reminder.count({
      where: { type: type.getValue() as any },
    });
  }

  async count(filters?: ReminderFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.reminder.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.variantId) {
      where.variantId = filters.variantId;
    }

    if (filters.type) {
      where.type = filters.type.getValue() as any;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

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
    variantId: string
  ): Promise<boolean> {
    const count = await this.prisma.reminder.count({
      where: {
        userId,
        variantId,
      },
    });

    return count > 0;
  }
}
