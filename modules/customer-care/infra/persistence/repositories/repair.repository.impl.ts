import { PrismaClient } from "@prisma/client";
import {
  IRepairRepository,
  RepairQueryOptions,
  RepairFilterOptions,
} from "../../../domain/repositories/repair.repository.js";
import { Repair } from "../../../domain/entities/repair.entity.js";
import { RepairId, RepairStatus } from "../../../domain/value-objects/index.js";

export class RepairRepositoryImpl implements IRepairRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): Repair {
    return Repair.fromDatabaseRow({
      repair_id: record.id,
      order_item_id: record.orderItemId,
      status: record.status,
      notes: record.notes,
    });
  }

  private dehydrate(repair: Repair): any {
    const row = repair.toDatabaseRow();
    return {
      id: row.repair_id,
      orderItemId: row.order_item_id,
      status: row.status,
      notes: row.notes,
    };
  }

  private buildOrderBy(options?: RepairQueryOptions): any {
    if (!options?.sortBy) {
      return { id: "desc" };
    }

    return {
      id: options.sortOrder || "asc",
    };
  }

  async save(repair: Repair): Promise<void> {
    const data = this.dehydrate(repair);
    await this.prisma.repair.create({ data });
  }

  async update(repair: Repair): Promise<void> {
    const data = this.dehydrate(repair);
    const { id, ...updateData } = data;
    await this.prisma.repair.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(repairId: RepairId): Promise<void> {
    await this.prisma.repair.delete({
      where: { id: repairId.getValue() },
    });
  }

  async findById(repairId: RepairId): Promise<Repair | null> {
    const record = await this.prisma.repair.findUnique({
      where: { id: repairId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByOrderItemId(
    orderItemId: string,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { orderItemId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: RepairStatus,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: RepairQueryOptions): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: RepairFilterOptions,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    const where: any = {};

    if (filters.orderItemId) {
      where.orderItemId = filters.orderItemId;
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.hasNotes !== undefined) {
      where.notes = filters.hasNotes ? { not: null } : null;
    }

    const records = await this.prisma.repair.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPending(options?: RepairQueryOptions): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { status: "pending" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findInProgress(options?: RepairQueryOptions): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { status: "in_progress" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findCompleted(options?: RepairQueryOptions): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { status: "completed" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findFailed(options?: RepairQueryOptions): Promise<Repair[]> {
    const records = await this.prisma.repair.findMany({
      where: { status: "failed" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByStatus(status: RepairStatus): Promise<number> {
    return await this.prisma.repair.count({
      where: { status: status.getValue() as any },
    });
  }

  async countByOrderItemId(orderItemId: string): Promise<number> {
    return await this.prisma.repair.count({
      where: { orderItemId },
    });
  }

  async count(filters?: RepairFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.repair.count();
    }

    const where: any = {};

    if (filters.orderItemId) {
      where.orderItemId = filters.orderItemId;
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.hasNotes !== undefined) {
      where.notes = filters.hasNotes ? { not: null } : null;
    }

    return await this.prisma.repair.count({ where });
  }

  async exists(repairId: RepairId): Promise<boolean> {
    const count = await this.prisma.repair.count({
      where: { id: repairId.getValue() },
    });

    return count > 0;
  }

  async hasActiveRepairForItem(orderItemId: string): Promise<boolean> {
    const count = await this.prisma.repair.count({
      where: {
        orderItemId,
        NOT: { status: { in: ["completed", "failed", "cancelled"] } },
      },
    });

    return count > 0;
  }
}
