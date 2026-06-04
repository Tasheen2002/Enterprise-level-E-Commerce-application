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

  async getDashboardMetrics(): Promise<unknown> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Total Revenue and Monthly Revenue and Trend
    const paidOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ["paid", "fulfilled", "partially_returned"]
        }
      },
      select: {
        totals: true,
        createdAt: true
      }
    });

    let totalRevenue = 0;
    let revenuePeriodA = 0;
    let revenuePeriodB = 0;
    const currentYear = now.getFullYear();
    const monthlyRevenue = Array(12).fill(0);

    paidOrders.forEach((o) => {
      if (o.totals && typeof o.totals === "object" && !Array.isArray(o.totals)) {
        const totalsObj = o.totals as { total?: number | string; totalAmount?: number | string };
        const totalVal = Number(totalsObj.total || totalsObj.totalAmount || 0);
        totalRevenue += totalVal;

        const orderDate = new Date(o.createdAt);
        if (orderDate.getFullYear() === currentYear) {
          const monthIndex = orderDate.getMonth();
          monthlyRevenue[monthIndex] = Number((monthlyRevenue[monthIndex] + totalVal).toFixed(2));
        }

        // Rolling periods for trend calculation
        if (orderDate >= thirtyDaysAgo) {
          revenuePeriodA += totalVal;
        } else if (orderDate >= sixtyDaysAgo) {
          revenuePeriodB += totalVal;
        }
      }
    });

    // Compute Revenue Trend
    let revenueTrendVal = 0;
    if (revenuePeriodB > 0) {
      revenueTrendVal = Number((((revenuePeriodA - revenuePeriodB) / revenuePeriodB) * 100).toFixed(1));
    } else if (revenuePeriodA > 0) {
      revenueTrendVal = 100.0;
    }
    const revenueTrendSign = revenueTrendVal >= 0 ? "+" : "";
    const revenueTrend = `${revenueTrendSign}${revenueTrendVal}% from last month`;

    // 2. Active Orders and Trend
    const activeOrdersCount = await this.prisma.order.count({
      where: {
        status: {
          in: ["created", "paid"]
        }
      }
    });

    const ordersPeriodA = await this.prisma.order.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    const ordersPeriodB = await this.prisma.order.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    let ordersTrendVal = 0;
    if (ordersPeriodB > 0) {
      ordersTrendVal = Number((((ordersPeriodA - ordersPeriodB) / ordersPeriodB) * 100).toFixed(1));
    } else if (ordersPeriodA > 0) {
      ordersTrendVal = 100.0;
    }
    const ordersTrendSign = ordersTrendVal >= 0 ? "+" : "";
    const ordersTrend = `${ordersTrendSign}${ordersTrendVal}% from last month`;

    // 3. New Customers and Trend
    const customerCount = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false
      }
    });

    const customersPeriodA = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false,
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    const customersPeriodB = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    let customersTrendVal = 0;
    if (customersPeriodB > 0) {
      customersTrendVal = Number((((customersPeriodA - customersPeriodB) / customersPeriodB) * 100).toFixed(1));
    } else if (customersPeriodA > 0) {
      customersTrendVal = 100.0;
    }
    const customersTrendSign = customersTrendVal >= 0 ? "+" : "";
    const customersTrend = `${customersTrendSign}${customersTrendVal}% from last month`;

    // 4. Conversion Rate and Trend
    const totalOrders = await this.prisma.order.count();
    const totalCarts = await this.prisma.shoppingCart.count();
    
    let conversionRate = 3.24;
    if (totalCarts > 0) {
      conversionRate = Number(((totalOrders / totalCarts) * 100).toFixed(2));
    }

    const cartsPeriodA = await this.prisma.shoppingCart.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const cartsPeriodB = await this.prisma.shoppingCart.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const convRateA = cartsPeriodA > 0 ? (ordersPeriodA / cartsPeriodA) * 100 : 0;
    const convRateB = cartsPeriodB > 0 ? (ordersPeriodB / cartsPeriodB) * 100 : 0;

    let conversionTrendVal = 0;
    if (convRateB > 0) {
      conversionTrendVal = Number((((convRateA - convRateB) / convRateB) * 100).toFixed(1));
    } else if (convRateA > 0) {
      conversionTrendVal = 100.0;
    }
    const conversionTrendSign = conversionTrendVal >= 0 ? "+" : "";
    const conversionTrend = `${conversionTrendSign}${conversionTrendVal}% from last month`;

    // 5. Today's Pulse Metrics
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const ordersToday = await this.prisma.order.count({
      where: {
        createdAt: { gte: startOfToday }
      }
    });

    const avgOrderValue = paidOrders.length > 0
      ? Number((totalRevenue / paidOrders.length).toFixed(2))
      : 0;

    const shippedItemsSum = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          status: { in: ["fulfilled"] }
        }
      },
      _sum: {
        qty: true
      }
    });
    const itemsShipped = shippedItemsSum._sum?.qty || 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      revenueTrend,
      activeOrders: activeOrdersCount,
      ordersTrend,
      newCustomers: customerCount,
      customersTrend,
      conversionRate: conversionRate,
      conversionTrend,
      monthlyRevenue,
      ordersToday,
      avgOrderValue,
      itemsShipped
    };
  }
}
