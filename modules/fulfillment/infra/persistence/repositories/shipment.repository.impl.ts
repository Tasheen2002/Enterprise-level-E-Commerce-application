import { PrismaClient } from "@prisma/client";
import {
  IShipmentRepository,
  ShipmentQueryOptions,
  ShipmentFilterOptions,
} from "../../../domain/repositories/shipment.repository";
import { Shipment } from "../../../domain/entities/shipment.entity";
import { ShipmentId, ShipmentStatus } from "../../../domain/value-objects";

interface ShipmentDatabaseRow {
  shipmentId: string;
  orderId: string;
  carrier: string | null;
  service: string | null;
  labelUrl: string | null;
  isGift: boolean;
  giftMessage: string | null;
  status: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShipmentRepositoryImpl implements IShipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row → Entity
  private toEntity(row: ShipmentDatabaseRow): Shipment {
    return Shipment.reconstitute({
      shipmentId: ShipmentId.fromString(row.shipmentId),
      orderId: row.orderId,
      carrier: row.carrier || undefined,
      service: row.service || undefined,
      labelUrl: row.labelUrl || undefined,
      isGift: Boolean(row.isGift),
      giftMessage: row.giftMessage || undefined,
      status: ShipmentStatus.create(row.status),
      items: [], // Items will be loaded separately
      shippedAt: row.shippedAt || undefined,
      deliveredAt: row.deliveredAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // Dehydration: Entity → Database row
  private fromEntity(
    shipment: Shipment
  ): Omit<ShipmentDatabaseRow, "createdAt" | "updatedAt"> {
    return {
      shipmentId: shipment.getShipmentId().getValue(),
      orderId: shipment.getOrderId(),
      carrier: shipment.getCarrier() || null,
      service: shipment.getService() || null,
      labelUrl: shipment.getLabelUrl() || null,
      isGift: shipment.isGiftOrder(),
      giftMessage: shipment.getGiftMessage() || null,
      status: shipment.getStatus().toString(),
      shippedAt: shipment.getShippedAt() || null,
      deliveredAt: shipment.getDeliveredAt() || null,
    };
  }

  async save(shipment: Shipment): Promise<void> {
    const data = this.fromEntity(shipment);

    await (this.prisma as any).shipment.create({
      data: {
        ...data,
        createdAt: shipment.getCreatedAt(),
        updatedAt: shipment.getUpdatedAt(),
      },
    });
  }

  async update(shipment: Shipment): Promise<void> {
    const data = this.fromEntity(shipment);

    await (this.prisma as any).shipment.update({
      where: { shipmentId: shipment.getShipmentId().getValue() },
      data: {
        ...data,
        updatedAt: shipment.getUpdatedAt(),
      },
    });
  }

  async delete(shipmentId: ShipmentId): Promise<void> {
    await (this.prisma as any).shipment.delete({
      where: { shipmentId: shipmentId.getValue() },
    });
  }

  async findById(shipmentId: ShipmentId): Promise<Shipment | null> {
    const row = await (this.prisma as any).shipment.findUnique({
      where: { shipmentId: shipmentId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    const query: any = {
      where: { orderId },
    };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }

  async findByStatus(
    status: ShipmentStatus,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    const query: any = {
      where: { status: status.toString() },
    };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }

  async findByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    const query: any = {
      where: { carrier },
    };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }

  async findAll(options?: ShipmentQueryOptions): Promise<Shipment[]> {
    const query: any = {};

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }

  async findWithFilters(
    filters: ShipmentFilterOptions,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    const where: any = {};

    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.status) where.status = filters.status.toString();
    if (filters.carrier) where.carrier = filters.carrier;
    if (filters.service) where.service = filters.service;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const query: any = { where };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }

  async countByStatus(status: ShipmentStatus): Promise<number> {
    return (this.prisma as any).shipment.count({
      where: { status: status.toString() },
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return (this.prisma as any).shipment.count({
      where: { orderId },
    });
  }

  async count(filters?: ShipmentFilterOptions): Promise<number> {
    const where: any = {};

    if (filters) {
      if (filters.orderId) where.orderId = filters.orderId;
      if (filters.status) where.status = filters.status.toString();
      if (filters.carrier) where.carrier = filters.carrier;
      if (filters.service) where.service = filters.service;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
    }

    return (this.prisma as any).shipment.count({ where });
  }

  async exists(shipmentId: ShipmentId): Promise<boolean> {
    const count = await (this.prisma as any).shipment.count({
      where: { shipmentId: shipmentId.getValue() },
    });
    return count > 0;
  }

  async existsByOrderId(orderId: string): Promise<boolean> {
    const count = await (this.prisma as any).shipment.count({
      where: { orderId },
    });
    return count > 0;
  }

  async findPendingShipments(
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    return this.findByStatus(ShipmentStatus.created(), options);
  }

  async findInTransitShipments(
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    return this.findByStatus(ShipmentStatus.inTransit(), options);
  }

  async findDeliveredShipments(
    startDate?: Date,
    endDate?: Date,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]> {
    const where: any = { status: ShipmentStatus.delivered().toString() };

    if (startDate || endDate) {
      where.deliveredAt = {};
      if (startDate) where.deliveredAt.gte = startDate;
      if (endDate) where.deliveredAt.lte = endDate;
    }

    const query: any = { where };

    if (options) {
      if (options.limit) query.take = options.limit;
      if (options.offset) query.skip = options.offset;
      if (options.sortBy) {
        query.orderBy = { [options.sortBy]: options.sortOrder || "desc" };
      }
    }

    const rows = await (this.prisma as any).shipment.findMany(query);
    return rows.map((row: ShipmentDatabaseRow) => this.toEntity(row));
  }
}
