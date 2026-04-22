import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../../domain/repositories/order-item.repository";
import { OrderItem } from "../../../domain/entities/order-item.entity";
import { ProductSnapshot, ProductSnapshotData } from "../../../domain/value-objects";

type OrderItemRow = Prisma.OrderItemGetPayload<Record<string, never>>;

export class OrderItemRepositoryImpl implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: OrderItemRow): OrderItem {
    const fallbackDate = new Date(0);
    return OrderItem.fromPersistence({
      orderItemId: row.id,
      orderId: row.orderId,
      variantId: row.variantId,
      quantity: row.qty,
      productSnapshot: ProductSnapshot.create(row.productSnapshot as unknown as ProductSnapshotData),
      isGift: row.isGift,
      giftMessage: row.giftMessage ?? undefined,
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    });
  }

  async save(orderItem: OrderItem): Promise<void> {
    const data = {
      orderId: orderItem.orderId,
      variantId: orderItem.variantId,
      qty: orderItem.quantity,
      productSnapshot: orderItem.productSnapshot.getValue() as unknown as Prisma.InputJsonValue,
      isGift: orderItem.isGift,
      giftMessage: orderItem.giftMessage || null,
    };
    await this.prisma.orderItem.upsert({
      where: { id: orderItem.orderItemId },
      create: { id: orderItem.orderItemId, ...data },
      update: data,
    });
  }

  async saveAll(orderItems: OrderItem[]): Promise<void> {
    if (orderItems.length === 0) {
      return;
    }

    await this.prisma.orderItem.createMany({
      data: orderItems.map((item) => ({
        id: item.orderItemId,
        orderId: item.orderId,
        variantId: item.variantId,
        qty: item.quantity,
        productSnapshot: item.productSnapshot.getValue() as any,
        isGift: item.isGift,
        giftMessage: item.giftMessage ?? null,
      })),
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

    return this.toEntity(item);
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
            : { createdAt: sortOrder },
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
      orderBy: sortBy === "quantity" ? { qty: sortOrder } : { createdAt: sortOrder },
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

    return result._sum.qty ?? 0;
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
