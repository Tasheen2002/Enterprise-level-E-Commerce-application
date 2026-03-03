import { PrismaClient } from "@prisma/client";
import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../../domain/repositories/order-item.repository";
import { OrderItem } from "../../../domain/entities/order-item.entity";
import { ProductSnapshot } from "../../../domain/value-objects";

interface OrderItemDatabaseRow {
  id: string;
  orderId: string;
  variantId: string;
  qty: number;
  productSnapshot: any;
  isGift: boolean;
  giftMessage: string | null;
}

export class OrderItemRepositoryImpl implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row � Entity
  private toEntity(row: OrderItemDatabaseRow): OrderItem {
    return OrderItem.reconstitute({
      orderItemId: row.id,
      orderId: row.orderId,
      variantId: row.variantId,
      quantity: row.qty,
      productSnapshot: ProductSnapshot.create(row.productSnapshot),
      isGift: row.isGift,
      giftMessage: row.giftMessage || undefined,
    });
  }

  async save(orderItem: OrderItem): Promise<void> {
    await this.prisma.orderItem.create({
      data: {
        id: orderItem.getOrderItemId(),
        orderId: orderItem.getOrderId(),
        variantId: orderItem.getVariantId(),
        qty: orderItem.getQuantity(),
        productSnapshot: orderItem.getProductSnapshot().toJSON() as any,
        isGift: orderItem.isGiftItem(),
        giftMessage: orderItem.getGiftMessage() || null,
      },
    });
  }

  async saveAll(orderItems: OrderItem[]): Promise<void> {
    if (orderItems.length === 0) {
      return;
    }

    await this.prisma.orderItem.createMany({
      data: orderItems.map((item) => ({
        id: item.getOrderItemId(),
        orderId: item.getOrderId(),
        variantId: item.getVariantId(),
        qty: item.getQuantity(),
        productSnapshot: item.getProductSnapshot().toJSON() as any,
        isGift: item.isGiftItem(),
        giftMessage: item.getGiftMessage() || null,
      })),
    });
  }

  async update(orderItem: OrderItem): Promise<void> {
    await this.prisma.orderItem.update({
      where: { id: orderItem.getOrderItemId() },
      data: {
        variantId: orderItem.getVariantId(),
        qty: orderItem.getQuantity(),
        productSnapshot: orderItem.getProductSnapshot().toJSON() as any,
        isGift: orderItem.isGiftItem(),
        giftMessage: orderItem.getGiftMessage() || null,
      },
    });
  }

  async delete(orderItemId: string): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id: orderItemId },
    });
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderItem.deleteMany({
      where: { orderId },
    });
  }

  async findById(orderItemId: string): Promise<OrderItem | null> {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    if (!item) {
      return null;
    }

    return this.toEntity(item as any);
  }

  async findByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      take: limit,
      skip: offset,
      orderBy:
        sortBy === "price"
          ? undefined // Can't directly sort by price in snapshot JSON
          : sortBy === "quantity"
            ? { qty: sortOrder }
            : undefined,
    });

    return items.map((item) => this.toEntity(item as any));
  }

  async findByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const items = await this.prisma.orderItem.findMany({
      where: { variantId },
      take: limit,
      skip: offset,
      orderBy: sortBy === "quantity" ? { qty: sortOrder } : undefined,
    });

    return items.map((item) => this.toEntity(item as any));
  }

  async findGiftItems(orderId: string): Promise<OrderItem[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        orderId,
        isGift: true,
      },
    });

    return items.map((item) => this.toEntity(item as any));
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.orderItem.count({
      where: { orderId },
    });
  }

  async countByVariantId(variantId: string): Promise<number> {
    return await this.prisma.orderItem.count({
      where: { variantId },
    });
  }

  async getTotalQuantityByVariantId(variantId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: { variantId },
      _sum: {
        qty: true,
      },
    });

    return result._sum.qty || 0;
  }

  async exists(orderItemId: string): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: { id: orderItemId },
    });

    return count > 0;
  }

  async existsByOrderIdAndVariantId(
    orderId: string,
    variantId: string,
  ): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: {
        orderId,
        variantId,
      },
    });

    return count > 0;
  }
}
