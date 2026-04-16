import { PrismaClient, OrderStatusEnum as PrismaOrderStatusEnum } from "@prisma/client";
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
import {
  OrderId,
  OrderNumber,
  OrderStatus,
  OrderSource,
  Currency,
  OrderTotals,
  ProductSnapshot,
  AddressSnapshot,
} from "../../../domain/value-objects";

interface OrderDatabaseRow {
  id: string;
  orderNo: string;
  userId: string | null;
  guestToken: string | null;
  totals: any;
  status: string;
  source: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  items?: any[];
  addresses?: any;
  shipments?: any[];
}

export class OrderRepositoryImpl
  extends PrismaRepository<Order>
  implements IOrderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // Hydration: Database row → Entity
  private toEntity(row: OrderDatabaseRow): Order {
    // Hydrate order items
    const items =
      row.items?.map((item) =>
        OrderItem.fromPersistence({
          orderItemId: item.id,
          orderId: row.id,
          variantId: item.variantId,
          quantity: item.qty,
          productSnapshot: ProductSnapshot.create(item.productSnapshot),
          isGift: item.isGift,
          giftMessage: item.giftMessage,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ) || [];

    // Hydrate order address
    let address: OrderAddress | undefined;

    // Handle both single object and array (Prisma returns array for one-to-one with findUnique include)
    const addressData = Array.isArray(row.addresses)
      ? row.addresses[0]
      : row.addresses;

    if (addressData) {
      // Check if address snapshots have required data (not empty JSON objects)
      const hasBillingData =
        addressData.billingSnapshot &&
        typeof addressData.billingSnapshot === "object" &&
        Object.keys(addressData.billingSnapshot).length > 0;
      const hasShippingData =
        addressData.shippingSnapshot &&
        typeof addressData.shippingSnapshot === "object" &&
        Object.keys(addressData.shippingSnapshot).length > 0;

      // Only create address if we have valid data
      if (hasBillingData && hasShippingData) {
        address = OrderAddress.fromPersistence({
          orderId: row.id,
          billingAddress: AddressSnapshot.create(addressData.billingSnapshot),
          shippingAddress: AddressSnapshot.create(addressData.shippingSnapshot),
          createdAt: addressData.createdAt,
          updatedAt: addressData.updatedAt,
        });
      }
    }

    // Hydrate shipments
    const shipments =
      row.shipments?.map((shipment) =>
        OrderShipment.fromPersistence({
          shipmentId: shipment.id,
          orderId: row.id,
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNumber: shipment.trackingNo,
          giftReceipt: shipment.giftReceipt,
          pickupLocationId: shipment.pickupLocationId,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
        }),
      ) || [];

    return Order.fromPersistence({
      id: OrderId.fromString(row.id),
      orderNumber: OrderNumber.fromString(row.orderNo),
      userId: row.userId || undefined,
      guestToken: row.guestToken || undefined,
      items,
      address,
      shipments,
      totals: OrderTotals.create(row.totals),
      status: OrderStatus.fromString(row.status),
      source: OrderSource.fromString(row.source),
      currency: Currency.create(row.currency),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(order: Order): Promise<void> {
    const orderId = order.id.getValue();
    const items = order.items;
    const address = order.address;
    const shipments = order.shipments;

    const orderData = {
      orderNo: order.orderNumber.getValue(),
      userId: order.userId || null,
      guestToken: order.guestToken || null,
      totals: order.totals.getValue() as any,
      status: order.status.getValue() as PrismaOrderStatusEnum,
      source: order.source.getValue(),
      currency: order.currency.getValue(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    await this.prisma.$transaction(async (tx) => {
      // Upsert order
      await tx.order.upsert({
        where: { id: orderId },
        create: { id: orderId, ...orderData },
        update: orderData,
      });

      // Sync order items: delete existing, recreate from entity state
      await tx.orderItem.deleteMany({ where: { orderId } });

      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            id: item.orderItemId,
            orderId,
            variantId: item.variantId,
            qty: item.quantity,
            productSnapshot: item.productSnapshot.getValue() as any,
            isGift: item.isGift,
            giftMessage: item.giftMessage,
          })),
        });
      }

      // Upsert or remove order address
      if (address) {
        await tx.orderAddress.upsert({
          where: { orderId },
          create: {
            orderId,
            billingSnapshot: address.billingAddress.getValue() as any,
            shippingSnapshot: address.shippingAddress.getValue() as any,
          },
          update: {
            billingSnapshot: address.billingAddress.getValue() as any,
            shippingSnapshot: address.shippingAddress.getValue() as any,
          },
        });
      } else {
        await tx.orderAddress.deleteMany({ where: { orderId } });
      }

      // Sync shipments: delete existing, recreate from entity state
      await tx.orderShipment.deleteMany({ where: { orderId } });

      if (shipments.length > 0) {
        await tx.orderShipment.createMany({
          data: shipments.map((shipment) => ({
            id: shipment.shipmentId,
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
    });

    await this.dispatchEvents(order);
  }

  async delete(orderId: OrderId): Promise<void> {
    await this.prisma.order.delete({
      where: { id: orderId.getValue() },
    });
  }

  async findById(orderId: OrderId): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId.getValue() },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    if (!order) {
      return null;
    }

    return this.toEntity(order as any);
  }

  async findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNo: orderNumber.getValue() },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    if (!order) {
      return null;
    }

    return this.toEntity(order as any);
  }

  async findByUserId(
    userId: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orders = await this.prisma.order.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    return orders.map((order) => this.toEntity(order as any));
  }

  async findByGuestToken(
    guestToken: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orders = await this.prisma.order.findMany({
      where: { guestToken },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    return orders.map((order) => this.toEntity(order as any));
  }

  async findByStatus(
    status: OrderStatus,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orders = await this.prisma.order.findMany({
      where: { status: status.getValue() as PrismaOrderStatusEnum },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    return orders.map((order) => this.toEntity(order as any));
  }

  async findAll(options?: OrderQueryOptions): Promise<Order[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orders = await this.prisma.order.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    return orders.map((order) => this.toEntity(order as any));
  }

  async findWithFilters(
    filters: OrderFilterOptions,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.guestToken) {
      whereClause.guestToken = filters.guestToken;
    }

    if (filters.status) {
      whereClause.status = filters.status.getValue();
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      whereClause.OR = [
        { orderNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        addresses: true,
        shipments: true,
      },
    });

    return orders.map((order) => this.toEntity(order as any));
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    return await this.prisma.order.count({
      where: { status: status.getValue() as PrismaOrderStatusEnum },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.order.count({
      where: { userId },
    });
  }

  async count(filters?: OrderFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.order.count();
    }

    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.guestToken) {
      whereClause.guestToken = filters.guestToken;
    }

    if (filters.status) {
      whereClause.status = filters.status.getValue();
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      whereClause.OR = [
        { orderNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await this.prisma.order.count({
      where: whereClause,
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
}
