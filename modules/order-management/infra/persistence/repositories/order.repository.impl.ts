import { PrismaClient, OrderStatusEnum as PrismaOrderStatusEnum } from "@prisma/client";
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

export class OrderRepositoryImpl implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row → Entity
  private toEntity(row: OrderDatabaseRow): Order {
    // Hydrate order items
    const items =
      row.items?.map((item) =>
        OrderItem.reconstitute({
          orderItemId: item.id,
          orderId: row.id,
          variantId: item.variantId,
          quantity: item.qty,
          productSnapshot: ProductSnapshot.create(item.productSnapshot),
          isGift: item.isGift,
          giftMessage: item.giftMessage,
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
        address = OrderAddress.reconstitute({
          orderId: row.id,
          billingAddress: AddressSnapshot.create(addressData.billingSnapshot),
          shippingAddress: AddressSnapshot.create(addressData.shippingSnapshot),
        });
      }
    }

    // Hydrate shipments
    const shipments =
      row.shipments?.map((shipment) =>
        OrderShipment.reconstitute({
          shipmentId: shipment.id,
          orderId: row.id,
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNumber: shipment.trackingNo,
          giftReceipt: shipment.giftReceipt,
          pickupLocationId: shipment.pickupLocationId,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
        }),
      ) || [];

    return Order.reconstitute({
      orderId: row.id,
      orderNumber: row.orderNo,
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
    const orderId = order.getOrderId().getValue();
    const items = order.getItems();
    const address = order.getAddress();
    const shipments = order.getShipments();

    await this.prisma.$transaction(async (tx) => {
      // Create order
      await tx.order.create({
        data: {
          id: orderId,
          orderNo: order.getOrderNumber().getValue(),
          userId: order.getUserId() || null,
          guestToken: order.getGuestToken() || null,
          totals: order.getTotals().toJSON() as any,
          status: order.getStatus().getValue() as PrismaOrderStatusEnum,
          source: order.getSource().getValue(),
          currency: order.getCurrency().getValue(),
          createdAt: order.getCreatedAt(),
          updatedAt: order.getUpdatedAt(),
        },
      });

      // Create order items
      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            id: item.getOrderItemId(),
            orderId: orderId,
            variantId: item.getVariantId(),
            qty: item.getQuantity(),
            productSnapshot: item.getProductSnapshot().toJSON() as any,
            isGift: item.isGiftItem(),
            giftMessage: item.getGiftMessage(),
          })),
        });
      }

      // Create order address
      if (address) {
        await tx.orderAddress.create({
          data: {
            orderId: orderId,
            billingSnapshot: address.getBillingAddress().toJSON() as any,
            shippingSnapshot: address.getShippingAddress().toJSON() as any,
          },
        });
      }

      // Create shipments
      if (shipments.length > 0) {
        await tx.orderShipment.createMany({
          data: shipments.map((shipment) => ({
            id: shipment.getShipmentId(),
            orderId: orderId,
            carrier: shipment.getCarrier(),
            service: shipment.getService(),
            trackingNo: shipment.getTrackingNumber(),
            giftReceipt: shipment.hasGiftReceipt(),
            pickupLocationId: shipment.getPickupLocationId(),
            shippedAt: shipment.getShippedAt(),
            deliveredAt: shipment.getDeliveredAt(),
          })),
        });
      }
    });
  }

  async update(order: Order): Promise<void> {
    const orderId = order.getOrderId().getValue();
    const items = order.getItems();
    const address = order.getAddress();
    const shipments = order.getShipments();

    await this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderNo: order.getOrderNumber().getValue(),
          userId: order.getUserId() || null,
          guestToken: order.getGuestToken() || null,
          totals: order.getTotals().toJSON() as any,
          status: order.getStatus().getValue() as PrismaOrderStatusEnum,
          source: order.getSource().getValue(),
          currency: order.getCurrency().getValue(),
          updatedAt: order.getUpdatedAt(),
        },
      });

      // Delete and recreate order items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId },
      });

      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            id: item.getOrderItemId(),
            orderId: orderId,
            variantId: item.getVariantId(),
            qty: item.getQuantity(),
            productSnapshot: item.getProductSnapshot().toJSON() as any,
            isGift: item.isGiftItem(),
            giftMessage: item.getGiftMessage(),
          })),
        });
      }

      // Update or create order address
      if (address) {
        await tx.orderAddress.upsert({
          where: { orderId: orderId },
          create: {
            orderId: orderId,
            billingSnapshot: address.getBillingAddress().toJSON() as any,
            shippingSnapshot: address.getShippingAddress().toJSON() as any,
          },
          update: {
            billingSnapshot: address.getBillingAddress().toJSON() as any,
            shippingSnapshot: address.getShippingAddress().toJSON() as any,
          },
        });
      } else {
        await tx.orderAddress.deleteMany({
          where: { orderId: orderId },
        });
      }

      // Delete and recreate shipments
      await tx.orderShipment.deleteMany({
        where: { orderId: orderId },
      });

      if (shipments.length > 0) {
        await tx.orderShipment.createMany({
          data: shipments.map((shipment) => ({
            id: shipment.getShipmentId(),
            orderId: orderId,
            carrier: shipment.getCarrier(),
            service: shipment.getService(),
            trackingNo: shipment.getTrackingNumber(),
            giftReceipt: shipment.hasGiftReceipt(),
            pickupLocationId: shipment.getPickupLocationId(),
            shippedAt: shipment.getShippedAt(),
            deliveredAt: shipment.getDeliveredAt(),
          })),
        });
      }
    });
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
