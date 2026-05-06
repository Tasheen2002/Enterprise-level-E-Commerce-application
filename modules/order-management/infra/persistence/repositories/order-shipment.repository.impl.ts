import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderShipmentRepository,
  ShipmentQueryOptions,
} from "../../../domain/repositories/order-shipment.repository";
import { OrderShipment } from "../../../domain/entities/order-shipment.entity";
import { OrderId } from "../../../domain/value-objects/order-id.vo";
import { ShipmentId } from "../../../domain/value-objects/shipment-id.vo";

type OrderShipmentRow = Prisma.OrderShipmentGetPayload<Record<string, never>>;

// Domain sortBy → Prisma column. All map 1:1 — kept as a typed Record so a
// new sortBy value added to the interface forces a TS error here.
const SORT_FIELD_MAP: Record<
  NonNullable<ShipmentQueryOptions["sortBy"]>,
  "shippedAt" | "deliveredAt" | "id"
> = {
  shippedAt: "shippedAt",
  deliveredAt: "deliveredAt",
  id: "id",
};

export class OrderShipmentRepositoryImpl implements IOrderShipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderShipmentRow): OrderShipment {
    return OrderShipment.fromPersistence({
      shipmentId: ShipmentId.fromString(row.id),
      orderId: row.orderId,
      carrier: row.carrier ?? undefined,
      service: row.service ?? undefined,
      trackingNumber: row.trackingNo ?? undefined,
      giftReceipt: row.giftReceipt,
      pickupLocationId: row.pickupLocationId ?? undefined,
      shippedAt: row.shippedAt ?? undefined,
      deliveredAt: row.deliveredAt ?? undefined,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

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
    const shipmentIdStr = shipment.shipmentId.getValue();
    await this.prisma.orderShipment.upsert({
      where: { id: shipmentIdStr },
      create: { id: shipmentIdStr, ...data },
      update: data,
    });
  }

  async delete(shipmentId: ShipmentId): Promise<void> {
    await this.prisma.orderShipment.delete({
      where: { id: shipmentId.getValue() },
    });
  }

  async deleteByOrderId(orderId: OrderId): Promise<void> {
    await this.prisma.orderShipment.deleteMany({
      where: { orderId: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findById(shipmentId: ShipmentId): Promise<OrderShipment | null> {
    const row = await this.prisma.orderShipment.findUnique({
      where: { id: shipmentId.getValue() },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipment | null> {
    const row = await this.prisma.orderShipment.findFirst({
      where: { trackingNo: trackingNumber },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(
    orderId: OrderId,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    return this.findMany({ orderId: orderId.getValue() }, options);
  }

  async findByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    return this.findMany({ carrier }, options);
  }

  async findShipped(options?: ShipmentQueryOptions): Promise<OrderShipment[]> {
    return this.findMany({ shippedAt: { not: null } }, options, "shippedAt");
  }

  async findDelivered(options?: ShipmentQueryOptions): Promise<OrderShipment[]> {
    return this.findMany({ deliveredAt: { not: null } }, options, "deliveredAt");
  }

  async findPending(options?: ShipmentQueryOptions): Promise<OrderShipment[]> {
    return this.findMany({ shippedAt: null }, options);
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async countByOrderId(orderId: OrderId): Promise<number> {
    return this.prisma.orderShipment.count({ where: { orderId: orderId.getValue() } });
  }

  async countByCarrier(carrier: string): Promise<number> {
    return this.prisma.orderShipment.count({ where: { carrier } });
  }

  async countShipped(): Promise<number> {
    return this.prisma.orderShipment.count({
      where: { shippedAt: { not: null } },
    });
  }

  async countDelivered(): Promise<number> {
    return this.prisma.orderShipment.count({
      where: { deliveredAt: { not: null } },
    });
  }

  async exists(shipmentId: ShipmentId): Promise<boolean> {
    const count = await this.prisma.orderShipment.count({
      where: { id: shipmentId.getValue() },
    });
    return count > 0;
  }

  async existsByTrackingNumber(trackingNumber: string): Promise<boolean> {
    const count = await this.prisma.orderShipment.count({
      where: { trackingNo: trackingNumber },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.OrderShipmentWhereInput,
    options: ShipmentQueryOptions | undefined,
    defaultSortBy: NonNullable<ShipmentQueryOptions["sortBy"]> = "id",
    defaultSortOrder: "asc" | "desc" = "desc",
  ): Promise<OrderShipment[]> {
    const {
      limit,
      offset,
      sortBy = defaultSortBy,
      sortOrder = defaultSortOrder,
    } = options || {};

    const rows = await this.prisma.orderShipment.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [SORT_FIELD_MAP[sortBy]]: sortOrder },
    });

    return rows.map((r) => this.toEntity(r));
  }
}
