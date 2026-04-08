import { PrismaClient } from "@prisma/client";
import {
  IReturnItemRepository,
  ReturnItemFilterOptions,
} from "../../../domain/repositories/return-item.repository.js";
import { ReturnItem } from "../../../domain/entities/return-item.entity.js";
import { ItemCondition, ItemDisposition } from "../../../domain/value-objects/index.js";

export class ReturnItemRepositoryImpl implements IReturnItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): ReturnItem {
    return ReturnItem.fromDatabaseRow({
      rma_id: record.rmaId,
      order_item_id: record.orderItemId,
      qty: record.qty,
      condition: record.condition,
      disposition: record.disposition,
      fees: record.fees !== null ? Number(record.fees) : null,
    });
  }

  private dehydrate(item: ReturnItem): any {
    const row = item.toDatabaseRow();
    return {
      rmaId: row.rma_id,
      orderItemId: row.order_item_id,
      qty: row.qty,
      condition: row.condition,
      disposition: row.disposition,
      fees: row.fees,
    };
  }

  async save(item: ReturnItem): Promise<void> {
    const data = this.dehydrate(item);
    await this.prisma.returnItem.create({ data });
  }

  async update(item: ReturnItem): Promise<void> {
    const data = this.dehydrate(item);
    await this.prisma.returnItem.update({
      where: {
        rmaId_orderItemId: {
          rmaId: data.rmaId,
          orderItemId: data.orderItemId,
        },
      },
      data,
    });
  }

  async delete(rmaId: string, orderItemId: string): Promise<void> {
    await this.prisma.returnItem.delete({
      where: {
        rmaId_orderItemId: {
          rmaId,
          orderItemId,
        },
      },
    });
  }

  async findById(rmaId: string, orderItemId: string): Promise<ReturnItem | null> {
    const record = await this.prisma.returnItem.findUnique({
      where: {
        rmaId_orderItemId: {
          rmaId,
          orderItemId,
        },
      },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByRmaId(rmaId: string): Promise<ReturnItem[]> {
    const records = await this.prisma.returnItem.findMany({
      where: { rmaId },
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByOrderItemId(orderItemId: string): Promise<ReturnItem[]> {
    const records = await this.prisma.returnItem.findMany({
      where: { orderItemId },
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(): Promise<ReturnItem[]> {
    const records = await this.prisma.returnItem.findMany();
    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(filters: ReturnItemFilterOptions): Promise<ReturnItem[]> {
    const where: any = {};

    if (filters.rmaId) {
      where.rmaId = filters.rmaId;
    }

    if (filters.orderItemId) {
      where.orderItemId = filters.orderItemId;
    }

    if (filters.condition) {
      where.condition = filters.condition.getValue();
    }

    if (filters.disposition) {
      where.disposition = filters.disposition.getValue();
    }

    const records = await this.prisma.returnItem.findMany({ where });
    return records.map((record) => this.hydrate(record));
  }

  async findByCondition(condition: ItemCondition): Promise<ReturnItem[]> {
    const records = await this.prisma.returnItem.findMany({
      where: { condition: condition.getValue() as any },
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByDisposition(disposition: ItemDisposition): Promise<ReturnItem[]> {
    const records = await this.prisma.returnItem.findMany({
      where: { disposition: disposition.getValue() as any },
    });

    return records.map((record) => this.hydrate(record));
  }

  async findItemsForRestock(rmaId?: string): Promise<ReturnItem[]> {
    const where: any = { disposition: "restock" };
    if (rmaId) {
      where.rmaId = rmaId;
    }

    const records = await this.prisma.returnItem.findMany({ where });
    return records.map((record) => this.hydrate(record));
  }

  async findItemsForRepair(rmaId?: string): Promise<ReturnItem[]> {
    const where: any = { disposition: "repair" };
    if (rmaId) {
      where.rmaId = rmaId;
    }

    const records = await this.prisma.returnItem.findMany({ where });
    return records.map((record) => this.hydrate(record));
  }

  async findItemsForDiscard(rmaId?: string): Promise<ReturnItem[]> {
    const where: any = { disposition: "discard" };
    if (rmaId) {
      where.rmaId = rmaId;
    }

    const records = await this.prisma.returnItem.findMany({ where });
    return records.map((record) => this.hydrate(record));
  }

  async findItemsWithFees(rmaId?: string): Promise<ReturnItem[]> {
    const where: any = { fees: { not: null } };
    if (rmaId) {
      where.rmaId = rmaId;
    }

    const records = await this.prisma.returnItem.findMany({ where });
    return records.map((record) => this.hydrate(record));
  }

  async countByRmaId(rmaId: string): Promise<number> {
    return await this.prisma.returnItem.count({
      where: { rmaId },
    });
  }

  async countByCondition(condition: ItemCondition): Promise<number> {
    return await this.prisma.returnItem.count({
      where: { condition: condition.getValue() as any },
    });
  }

  async countByDisposition(disposition: ItemDisposition): Promise<number> {
    return await this.prisma.returnItem.count({
      where: { disposition: disposition.getValue() as any },
    });
  }

  async count(filters?: ReturnItemFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.returnItem.count();
    }

    const where: any = {};

    if (filters.rmaId) {
      where.rmaId = filters.rmaId;
    }

    if (filters.orderItemId) {
      where.orderItemId = filters.orderItemId;
    }

    if (filters.condition) {
      where.condition = filters.condition.getValue();
    }

    if (filters.disposition) {
      where.disposition = filters.disposition.getValue();
    }

    return await this.prisma.returnItem.count({ where });
  }

  async exists(rmaId: string, orderItemId: string): Promise<boolean> {
    const count = await this.prisma.returnItem.count({
      where: {
        rmaId,
        orderItemId,
      },
    });

    return count > 0;
  }

  async hasItemsForRma(rmaId: string): Promise<boolean> {
    const count = await this.prisma.returnItem.count({
      where: { rmaId },
    });

    return count > 0;
  }

  async saveAll(items: ReturnItem[]): Promise<void> {
    const data = items.map((item) => this.dehydrate(item));
    await this.prisma.returnItem.createMany({ data });
  }

  async deleteByRmaId(rmaId: string): Promise<void> {
    await this.prisma.returnItem.deleteMany({
      where: { rmaId },
    });
  }
}
