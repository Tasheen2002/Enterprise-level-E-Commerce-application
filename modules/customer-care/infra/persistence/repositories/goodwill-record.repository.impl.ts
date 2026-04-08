import { PrismaClient } from "@prisma/client";
import {
  IGoodwillRecordRepository,
  GoodwillRecordQueryOptions,
  GoodwillRecordFilterOptions,
} from "../../../domain/repositories/goodwill-record.repository.js";
import { GoodwillRecord } from "../../../domain/entities/goodwill-record.entity.js";
import {
  GoodwillId,
  GoodwillType,
} from "../../../domain/value-objects/index.js";

export class GoodwillRecordRepositoryImpl implements IGoodwillRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): GoodwillRecord {
    return GoodwillRecord.fromDatabaseRow({
      goodwill_id: record.id,
      user_id: record.userId,
      order_id: record.orderId,
      type: record.type,
      value: Number(record.value),
      reason: record.reason,
      created_at: record.createdAt,
    });
  }

  private dehydrate(record: GoodwillRecord): any {
    const row = record.toDatabaseRow();
    return {
      id: row.goodwill_id,
      userId: row.user_id,
      orderId: row.order_id,
      type: row.type,
      value: row.value,
      reason: row.reason,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: GoodwillRecordQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    const sortField = options.sortBy === "value" ? "value" : options.sortBy;
    return {
      [sortField]: options.sortOrder || "asc",
    };
  }

  async save(record: GoodwillRecord): Promise<void> {
    const data = this.dehydrate(record);
    await this.prisma.goodwillRecord.create({ data });
  }

  async update(record: GoodwillRecord): Promise<void> {
    const data = this.dehydrate(record);
    const { id, ...updateData } = data;
    await this.prisma.goodwillRecord.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(goodwillId: GoodwillId): Promise<void> {
    await this.prisma.goodwillRecord.delete({
      where: { id: goodwillId.getValue() },
    });
  }

  async findById(goodwillId: GoodwillId): Promise<GoodwillRecord | null> {
    const record = await this.prisma.goodwillRecord.findUnique({
      where: { id: goodwillId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const records = await this.prisma.goodwillRecord.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByOrderId(
    orderId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const records = await this.prisma.goodwillRecord.findMany({
      where: { orderId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByType(
    type: GoodwillType,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const records = await this.prisma.goodwillRecord.findMany({
      where: { type: type.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const records = await this.prisma.goodwillRecord.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: GoodwillRecordFilterOptions,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.type) {
      where.type = filters.type.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.value = {};
      if (filters.minValue !== undefined) {
        where.value.gte = filters.minValue;
      }
      if (filters.maxValue !== undefined) {
        where.value.lte = filters.maxValue;
      }
    }

    const records = await this.prisma.goodwillRecord.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findStoreCredits(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const where: any = { type: "store_credit" };
    if (userId) {
      where.userId = userId;
    }

    const records = await this.prisma.goodwillRecord.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findDiscounts(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const where: any = { type: "discount" };
    if (userId) {
      where.userId = userId;
    }

    const records = await this.prisma.goodwillRecord.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPoints(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    const where: any = { type: "points" };
    if (userId) {
      where.userId = userId;
    }

    const records = await this.prisma.goodwillRecord.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findRecentByUser(
    userId: string,
    limit?: number
  ): Promise<GoodwillRecord[]> {
    const records = await this.prisma.goodwillRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async getTotalValueByUser(
    userId: string,
    type?: GoodwillType
  ): Promise<number> {
    const where: any = { userId };
    if (type) {
      where.type = type.getValue();
    }

    const result = await this.prisma.goodwillRecord.aggregate({
      where,
      _sum: {
        value: true,
      },
    });

    // Handle possibly undefined _sum and value
    return Number(result._sum?.value ?? 0);
  }

  async getTotalValueByOrder(
    orderId: string,
    type?: GoodwillType
  ): Promise<number> {
    const where: any = { orderId };
    if (type) {
      where.type = type.getValue();
    }

    const result = await this.prisma.goodwillRecord.aggregate({
      where,
      _sum: {
        value: true,
      },
    });

    // Handle possibly undefined _sum and value
    return Number(result._sum?.value ?? 0);
  }

  async countByType(type: GoodwillType): Promise<number> {
    return await this.prisma.goodwillRecord.count({
      where: { type: type.getValue() as any },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.goodwillRecord.count({
      where: { userId },
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.goodwillRecord.count({
      where: { orderId },
    });
  }

  async count(filters?: GoodwillRecordFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.goodwillRecord.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.type) {
      where.type = filters.type.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.value = {};
      if (filters.minValue !== undefined) {
        where.value.gte = filters.minValue;
      }
      if (filters.maxValue !== undefined) {
        where.value.lte = filters.maxValue;
      }
    }

    return await this.prisma.goodwillRecord.count({ where });
  }

  async exists(goodwillId: GoodwillId): Promise<boolean> {
    const count = await this.prisma.goodwillRecord.count({
      where: { id: goodwillId.getValue() },
    });

    return count > 0;
  }

  async hasGoodwillForUser(userId: string): Promise<boolean> {
    const count = await this.prisma.goodwillRecord.count({
      where: { userId },
    });

    return count > 0;
  }

  async hasGoodwillForOrder(orderId: string): Promise<boolean> {
    const count = await this.prisma.goodwillRecord.count({
      where: { orderId },
    });

    return count > 0;
  }
}
