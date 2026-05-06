import { PrismaClient, Prisma, OrderStatusEnum as PrismaOrderStatusEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IOrderRepository,
  OrderQueryOptions,
  OrderFilterOptions,
} from "../../../domain/repositories/order.repository";
import { Order } from "../../../domain/entities/order.entity";
import { OrderItem } from "../../../domain/entities/order-item.entity";
import { OrderAddress } from "../../../domain/entities/order-address.entity";
import { OrderShipment } from "../../../domain/entities/order-shipment.entity";
import { OrderStatusHistory } from "../../../domain/entities/order-status-history.entity";
import {
  OrderId,
  OrderItemId,
  OrderNumber,
  OrderStatus,
  OrderSource,
  Currency,
  OrderTotals,
  ProductSnapshot,
  AddressSnapshot,
  ShipmentId,
  ProductSnapshotData,
  AddressSnapshotData,
} from "../../../domain/value-objects";

// Standard include shape for full-aggregate hydration. Reused everywhere we
// need to rebuild an Order from the DB.
const ORDER_INCLUDE = {
  items: true,
  addresses: true,
  shipments: true,
} as const satisfies Prisma.OrderInclude;

type OrderWithIncludes = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

// Domain sortBy → Prisma column. `orderNumber` is the domain name; the DB
// column is `orderNo` (Prisma uses model field name not the @map alias).
const SORT_FIELD_MAP: Record<
  NonNullable<OrderQueryOptions["sortBy"]>,
  "createdAt" | "updatedAt" | "orderNo"
> = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  orderNumber: "orderNo",
};

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;

export class OrderRepositoryImpl
  extends PrismaRepository<Order>
  implements IOrderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderWithIncludes): Order {
    const items = row.items.map((item) =>
      OrderItem.fromPersistence({
        orderItemId: OrderItemId.fromString(item.id),
        orderId: row.id,
        variantId: item.variantId,
        quantity: item.qty,
        productSnapshot: ProductSnapshot.create(
          item.productSnapshot as unknown as ProductSnapshotData,
        ),
        isGift: item.isGift,
        giftMessage: item.giftMessage ?? undefined,
      }),
    );

    // Prisma returns one-to-one as a single nullable object. Defensive array
    // handling preserved against past behavior in some Prisma versions where
    // `findUnique` + include returned the relation as an array.
    const addressData = Array.isArray(row.addresses)
      ? row.addresses[0]
      : row.addresses;

    let address: OrderAddress | undefined;
    if (addressData) {
      const billing = addressData.billingSnapshot;
      const shipping = addressData.shippingSnapshot;
      const hasBilling =
        billing && typeof billing === "object" && Object.keys(billing).length > 0;
      const hasShipping =
        shipping && typeof shipping === "object" && Object.keys(shipping).length > 0;

      if (hasBilling && hasShipping) {
        address = OrderAddress.fromPersistence({
          orderId: row.id,
          billingAddress: AddressSnapshot.create(
            billing as unknown as AddressSnapshotData,
          ),
          shippingAddress: AddressSnapshot.create(
            shipping as unknown as AddressSnapshotData,
          ),
        });
      }
    }

    const shipments = row.shipments.map((shipment) =>
      OrderShipment.fromPersistence({
        shipmentId: ShipmentId.fromString(shipment.id),
        orderId: row.id,
        carrier: shipment.carrier ?? undefined,
        service: shipment.service ?? undefined,
        trackingNumber: shipment.trackingNo ?? undefined,
        giftReceipt: shipment.giftReceipt,
        pickupLocationId: shipment.pickupLocationId ?? undefined,
        shippedAt: shipment.shippedAt ?? undefined,
        deliveredAt: shipment.deliveredAt ?? undefined,
      }),
    );

    return Order.fromPersistence({
      id: OrderId.fromString(row.id),
      orderNumber: OrderNumber.fromString(row.orderNo),
      userId: row.userId ?? undefined,
      guestToken: row.guestToken ?? undefined,
      items,
      address,
      shipments,
      totals: OrderTotals.create(row.totals as Prisma.JsonObject as never),
      status: OrderStatus.fromString(row.status),
      source: OrderSource.fromString(row.source),
      currency: Currency.create(row.currency),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  // FLAG: items and shipments are synced by delete-then-recreate. With
  // `Backorder`/`Preorder` referencing OrderItem.id via `onDelete: Cascade`,
  // saving an order will silently drop their satellite rows. Long-term: use
  // diff-based upsert/delete instead of wholesale recreation.
  async save(order: Order): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.persistOrderInTransaction(tx, order);
    });
    await this.dispatchEvents(order);
  }

  // Atomic create-time write: persists the order aggregate AND its initial
  // status-history audit row in a single transaction. Previously the service
  // issued three sequential, independent saves — a failure between them
  // could leave a CREATED order with no audit trail. This collapses those
  // writes into one rollback boundary.
  async saveWithStatusHistory(
    order: Order,
    statusHistory: OrderStatusHistory,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.persistOrderInTransaction(tx, order);
      await tx.orderStatusHistory.create({
        data: {
          orderId: statusHistory.orderId,
          fromStatus: (statusHistory.fromStatus?.getValue() ?? null) as PrismaOrderStatusEnum | null,
          toStatus: statusHistory.toStatus.getValue() as PrismaOrderStatusEnum,
          changedBy: statusHistory.changedBy ?? null,
        },
      });
    });
    await this.dispatchEvents(order);
  }

  // Shared persistence logic for `save` / `saveWithStatusHistory`. Operates
  // on a Prisma transaction client so callers can compose it into larger
  // atomic writes.
  private async persistOrderInTransaction(
    tx: Prisma.TransactionClient,
    order: Order,
  ): Promise<void> {
    const orderId = order.id.getValue();
    const items = order.items;
    const address = order.address;
    const shipments = order.shipments;

    const orderData = {
      orderNo: order.orderNumber.getValue(),
      userId: order.userId ?? null,
      guestToken: order.guestToken ?? null,
      totals: order.totals.getValue() as unknown as Prisma.InputJsonValue,
      status: order.status.getValue() as PrismaOrderStatusEnum,
      source: order.source.getValue(),
      currency: order.currency.getValue(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    await tx.order.upsert({
      where: { id: orderId },
      create: { id: orderId, ...orderData },
      update: orderData,
    });

    await tx.orderItem.deleteMany({ where: { orderId } });
    if (items.length > 0) {
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          id: item.orderItemId.getValue(),
          orderId,
          variantId: item.variantId,
          qty: item.quantity,
          productSnapshot: item.productSnapshot.getValue() as unknown as Prisma.InputJsonValue,
          isGift: item.isGift,
          giftMessage: item.giftMessage,
        })),
      });
    }

    if (address) {
      const billingSnapshot = address.billingAddress.getValue() as unknown as Prisma.InputJsonValue;
      const shippingSnapshot = address.shippingAddress.getValue() as unknown as Prisma.InputJsonValue;
      await tx.orderAddress.upsert({
        where: { orderId },
        create: { orderId, billingSnapshot, shippingSnapshot },
        update: { billingSnapshot, shippingSnapshot },
      });
    } else {
      await tx.orderAddress.deleteMany({ where: { orderId } });
    }

    await tx.orderShipment.deleteMany({ where: { orderId } });
    if (shipments.length > 0) {
      await tx.orderShipment.createMany({
        data: shipments.map((shipment) => ({
          id: shipment.shipmentId.getValue(),
          orderId,
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNo: shipment.trackingNumber,
          giftReceipt: shipment.giftReceipt,
          pickupLocationId: shipment.pickupLocationId,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
        })),
      });
    }
  }

  async delete(orderId: OrderId): Promise<void> {
    await this.prisma.order.delete({
      where: { id: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findById(orderId: OrderId): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id: orderId.getValue() },
      include: ORDER_INCLUDE,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { orderNo: orderNumber.getValue() },
      include: ORDER_INCLUDE,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string, options?: OrderQueryOptions): Promise<Order[]> {
    return this.findMany({ userId }, options);
  }

  async findByGuestToken(guestToken: string, options?: OrderQueryOptions): Promise<Order[]> {
    return this.findMany({ guestToken }, options);
  }

  async findByStatus(status: OrderStatus, options?: OrderQueryOptions): Promise<Order[]> {
    return this.findMany(
      { status: status.getValue() as PrismaOrderStatusEnum },
      options,
    );
  }

  async findAll(options?: OrderQueryOptions): Promise<Order[]> {
    return this.findMany({}, options);
  }

  async findWithFilters(
    filters: OrderFilterOptions,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    return this.findMany(this.buildWhereFromFilters(filters), options);
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async countByStatus(status: OrderStatus): Promise<number> {
    return this.prisma.order.count({
      where: { status: status.getValue() as PrismaOrderStatusEnum },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.order.count({ where: { userId } });
  }

  async count(filters?: OrderFilterOptions): Promise<number> {
    return this.prisma.order.count({
      where: filters ? this.buildWhereFromFilters(filters) : undefined,
    });
  }

  async exists(orderId: OrderId): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: { id: orderId.getValue() },
    });
    return count > 0;
  }

  async existsByOrderNumber(orderNumber: OrderNumber): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: { orderNo: orderNumber.getValue() },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.OrderWhereInput,
    options: OrderQueryOptions | undefined,
  ): Promise<Order[]> {
    const {
      limit = DEFAULT_LIMIT,
      offset = DEFAULT_OFFSET,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const rows = await this.prisma.order.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [SORT_FIELD_MAP[sortBy]]: sortOrder },
      include: ORDER_INCLUDE,
    });

    return rows.map((r) => this.toEntity(r));
  }

  private buildWhereFromFilters(filters: OrderFilterOptions): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.guestToken) where.guestToken = filters.guestToken;
    if (filters.status) {
      where.status = filters.status.getValue() as PrismaOrderStatusEnum;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { orderNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
