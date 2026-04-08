import { PrismaClient } from "@prisma/client";
import {
  IShipmentItemRepository,
  ShipmentItemQueryOptions,
  ShipmentItemFilterOptions,
} from "../../../domain/repositories/shipment-item.repository";
import { ShipmentItem } from "../../../domain/entities/shipment-item.entity";

interface ShipmentItemDatabaseRow {
  shipmentId: string;
  orderItemId: string;
  qty: number;
  giftWrap: boolean;
  giftMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShipmentItemRepositoryImpl implements IShipmentItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row → Entity
  private toEntity(row: ShipmentItemDatabaseRow): ShipmentItem {
    return ShipmentItem.reconstitute({
      shipmentId: row.shipmentId,
      orderItemId: row.orderItemId,
      qty: row.qty,
      giftWrap: row.giftWrap,
      giftMessage: row.giftMessage || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // Dehydration: Entity → Database row
  private fromEntity(
    item: ShipmentItem
  ): Omit<ShipmentItemDatabaseRow, "createdAt" | "updatedAt"> {
    return {
      shipmentId: item.getShipmentId(),
      orderItemId: item.getOrderItemId(),
      qty: item.getQty(),
      giftWrap: item.isGiftWrapped(),
      giftMessage: item.getGiftMessage() || null,
    };
  }

  async save(item: ShipmentItem): Promise<void> {
    const data = this.fromEntity(item);

    await (this.prisma as any).shipmentItem.create({
      data: {
        ...data,
        createdAt: item.getCreatedAt(),
        updatedAt: item.getUpdatedAt(),
      },
    });
  }

  async update(item: ShipmentItem): Promise<void> {
    const data = this.fromEntity(item);

    await (this.prisma as any).shipmentItem.update({
      where: {
        shipmentId_orderItemId: {
          shipmentId: item.getShipmentId(),
          orderItemId: item.getOrderItemId(),
        },
      },
      data: {
        ...data,
        updatedAt: item.getUpdatedAt(),
      },
    });
  }

  async delete(shipmentId: string, orderItemId: string): Promise<void> {
    await (this.prisma as any).shipmentItem.delete({
      where: {
        shipmentId_orderItemId: {
          shipmentId,
          orderItemId,
        },
      },
    });
  }

  async deleteByShipmentId(shipmentId: string): Promise<void> {
    await (this.prisma as any).shipmentItem.deleteMany({
      where: { shipmentId },
    });
  }

  async findByShipmentId(
    shipmentId: string,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]> {
    const query: any = {
      where: { shipmentId },
    };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "asc" };
      }
    }

    const rows = await (this.prisma as any).shipmentItem.findMany(query);
    return rows.map((row: ShipmentItemDatabaseRow) => this.toEntity(row));
  }

  async findByOrderItemId(orderItemId: string): Promise<ShipmentItem[]> {
    const rows = await (this.prisma as any).shipmentItem.findMany({
      where: { orderItemId },
    });
    return rows.map((row: ShipmentItemDatabaseRow) => this.toEntity(row));
  }

  async findByShipmentAndOrderItem(
    shipmentId: string,
    orderItemId: string
  ): Promise<ShipmentItem | null> {
    const row = await (this.prisma as any).shipmentItem.findUnique({
      where: {
        shipmentId_orderItemId: {
          shipmentId,
          orderItemId,
        },
      },
    });

    return row ? this.toEntity(row) : null;
  }

  async findAll(options?: ShipmentItemQueryOptions): Promise<ShipmentItem[]> {
    const query: any = {};

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "asc" };
      }
    }

    const rows = await (this.prisma as any).shipmentItem.findMany(query);
    return rows.map((row: ShipmentItemDatabaseRow) => this.toEntity(row));
  }

  async findWithFilters(
    filters: ShipmentItemFilterOptions,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]> {
    const where: any = {};

    if (filters.shipmentId) where.shipmentId = filters.shipmentId;
    if (filters.orderItemId) where.orderItemId = filters.orderItemId;
    if (filters.giftWrap !== undefined) where.giftWrap = filters.giftWrap;

    const query: any = { where };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "asc" };
      }
    }

    const rows = await (this.prisma as any).shipmentItem.findMany(query);
    return rows.map((row: ShipmentItemDatabaseRow) => this.toEntity(row));
  }

  async findGiftWrappedItems(
    shipmentId?: string,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]> {
    const where: any = { giftWrap: true };
    if (shipmentId) where.shipmentId = shipmentId;

    const query: any = { where };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "asc" };
      }
    }

    const rows = await (this.prisma as any).shipmentItem.findMany(query);
    return rows.map((row: ShipmentItemDatabaseRow) => this.toEntity(row));
  }

  async getTotalQuantityByShipment(shipmentId: string): Promise<number> {
    const result = await (this.prisma as any).shipmentItem.aggregate({
      where: { shipmentId },
      _sum: { qty: true },
    });

    return result._sum.qty || 0;
  }

  async count(filters?: ShipmentItemFilterOptions): Promise<number> {
    const where: any = {};

    if (filters) {
      if (filters.shipmentId) where.shipmentId = filters.shipmentId;
      if (filters.orderItemId) where.orderItemId = filters.orderItemId;
      if (filters.giftWrap !== undefined) where.giftWrap = filters.giftWrap;
    }

    return (this.prisma as any).shipmentItem.count({ where });
  }

  async exists(shipmentId: string, orderItemId: string): Promise<boolean> {
    const count = await (this.prisma as any).shipmentItem.count({
      where: {
        shipmentId,
        orderItemId,
      },
    });
    return count > 0;
  }

  async existsByShipmentId(shipmentId: string): Promise<boolean> {
    const count = await (this.prisma as any).shipmentItem.count({
      where: { shipmentId },
    });
    return count > 0;
  }

  async existsByOrderItemId(orderItemId: string): Promise<boolean> {
    const count = await (this.prisma as any).shipmentItem.count({
      where: { orderItemId },
    });
    return count > 0;
  }
}
