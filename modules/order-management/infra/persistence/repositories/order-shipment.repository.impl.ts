import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderShipmentRepository,
  ShipmentQueryOptions,
} from "../../../domain/repositories/order-shipment.repository";
import { OrderShipment } from "../../../domain/entities/order-shipment.entity";

type OrderShipmentRow = Prisma.OrderShipmentGetPayload<Record<string, never>>;

export class OrderShipmentRepositoryImpl implements IOrderShipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: OrderShipmentRow): OrderShipment {
    return OrderShipment.fromPersistence({
      shipmentId: row.id,
      orderId: row.orderId,
      carrier: row.carrier ?? undefined,
      service: row.service ?? undefined,
      trackingNumber: row.trackingNo ?? undefined,
      giftReceipt: row.giftReceipt,
      pickupLocationId: row.pickupLocationId ?? undefined,
      shippedAt: row.shippedAt ?? undefined,
      deliveredAt: row.deliveredAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(shipment: OrderShipment): Promise<void> {
    const data = {
      orderId: shipment.orderId,
      carrier: shipment.carrier ?? null,
      service: shipment.service ?? null,
      trackingNo: shipment.trackingNumber ?? null,
      giftReceipt: shipment.giftReceipt,
      pickupLocationId: shipment.pickupLocationId ?? null,
      shippedAt: shipment.shippedAt ?? null,
      deliveredAt: shipment.deliveredAt ?? null,
    };
    await this.prisma.orderShipment.upsert({
      where: { id: shipment.shipmentId },
      create: { id: shipment.shipmentId, ...data },
      update: data,
    });
  }

  async delete(shipmentId: string): Promise<void> {
    await this.prisma.orderShipment.delete({
      where: { id: shipmentId },
    });
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderShipment.deleteMany({
      where: { orderId },
    });
  }

  async findById(shipmentId: string): Promise<OrderShipment | null> {
    const shipment = await this.prisma.orderShipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return null;
    }

    return this.toEntity(shipment);
  }

  async findByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const shipments = await this.prisma.orderShipment.findMany({
      where: { orderId },
      take: limit,
      skip: offset,
      orderBy:
        sortBy === "shippedAt"
          ? { shippedAt: sortOrder }
          : sortBy === "deliveredAt"
            ? { deliveredAt: sortOrder }
            : { createdAt: sortOrder },
    });

    return shipments.map((shipment) => this.toEntity(shipment));
  }

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipment | null> {
    const shipment = await this.prisma.orderShipment.findFirst({
      where: { trackingNo: trackingNumber },
    });

    if (!shipment) {
      return null;
    }

    return this.toEntity(shipment);
  }

  async findByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const shipments = await this.prisma.orderShipment.findMany({
      where: { carrier },
      take: limit,
      skip: offset,
      orderBy:
        sortBy === "shippedAt"
          ? { shippedAt: sortOrder }
          : sortBy === "deliveredAt"
            ? { deliveredAt: sortOrder }
            : { createdAt: sortOrder },
    });

    return shipments.map((shipment) => this.toEntity(shipment));
  }

  async findShipped(options?: ShipmentQueryOptions): Promise<OrderShipment[]> {
    const {
      limit,
      offset,
      sortBy = "shippedAt",
      sortOrder = "desc",
    } = options || {};

    const shipments = await this.prisma.orderShipment.findMany({
      where: {
        shippedAt: { not: null },
      },
      take: limit,
      skip: offset,
      orderBy:
        sortBy === "shippedAt"
          ? { shippedAt: sortOrder }
          : sortBy === "deliveredAt"
            ? { deliveredAt: sortOrder }
            : undefined,
    });

    return shipments.map((shipment) => this.toEntity(shipment));
  }

  async findDelivered(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    const {
      limit,
      offset,
      sortBy = "deliveredAt",
      sortOrder = "desc",
    } = options || {};

    const shipments = await this.prisma.orderShipment.findMany({
      where: {
        deliveredAt: { not: null },
      },
      take: limit,
      skip: offset,
      orderBy:
        sortBy === "shippedAt"
          ? { shippedAt: sortOrder }
          : sortBy === "deliveredAt"
            ? { deliveredAt: sortOrder }
            : undefined,
    });

    return shipments.map((shipment) => this.toEntity(shipment));
  }

  async findPending(options?: ShipmentQueryOptions): Promise<OrderShipment[]> {
    const { limit, offset } = options || {};

    const shipments = await this.prisma.orderShipment.findMany({
      where: {
        shippedAt: null,
      },
      take: limit,
      skip: offset,
    });

    return shipments.map((shipment) => this.toEntity(shipment));
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.orderShipment.count({
      where: { orderId },
    });
  }

  async countByCarrier(carrier: string): Promise<number> {
    return await this.prisma.orderShipment.count({
      where: { carrier },
    });
  }

  async countShipped(): Promise<number> {
    return await this.prisma.orderShipment.count({
      where: {
        shippedAt: { not: null },
      },
    });
  }

  async countDelivered(): Promise<number> {
    return await this.prisma.orderShipment.count({
      where: {
        deliveredAt: { not: null },
      },
    });
  }

  async exists(shipmentId: string): Promise<boolean> {
    const count = await this.prisma.orderShipment.count({
      where: { id: shipmentId },
    });

    return count > 0;
  }

  async existsByTrackingNumber(trackingNumber: string): Promise<boolean> {
    const count = await this.prisma.orderShipment.count({
      where: { trackingNo: trackingNumber },
    });

    return count > 0;
  }
}
