import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../../domain/repositories/order-item.repository";
import { OrderItem } from "../../../domain/entities/order-item.entity";
import { OrderId, OrderItemId, ProductSnapshot, ProductSnapshotData } from "../../../domain/value-objects";

type OrderItemRow = Prisma.OrderItemGetPayload<Record<string, never>>;

// Domain sortBy → Prisma column. `id` and `qty` map to real columns; `price`
// has no DB column (lives inside the productSnapshot JSON), so sort is
// dropped (undefined) when the caller asks for it.
const SORT_FIELD_MAP: Record<
  NonNullable<OrderItemQueryOptions["sortBy"]>,
  "id" | "qty" | undefined
> = {
  id: "id",
  quantity: "qty",
  price: undefined,
};

export class OrderItemRepositoryImpl implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderItemRow): OrderItem {
    return OrderItem.fromPersistence({
      orderItemId: OrderItemId.fromString(row.id),
      orderId: row.orderId,
      variantId: row.variantId,
      quantity: row.qty,
      productSnapshot: ProductSnapshot.create(
        row.productSnapshot as unknown as ProductSnapshotData,
      ),
      isGift: row.isGift,
      giftMessage: row.giftMessage ?? undefined,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(orderItem: OrderItem): Promise<void> {
    const id = orderItem.orderItemId.getValue();
    const data = {
      orderId: orderItem.orderId,
      variantId: orderItem.variantId,
      qty: orderItem.quantity,
      productSnapshot: orderItem.productSnapshot.getValue() as unknown as Prisma.InputJsonValue,
      isGift: orderItem.isGift,
      giftMessage: orderItem.giftMessage ?? null,
    };
    await this.prisma.orderItem.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }

  async saveAll(orderItems: OrderItem[]): Promise<void> {
    if (orderItems.length === 0) return;

    await this.prisma.orderItem.createMany({
      data: orderItems.map((item) => ({
        id: item.orderItemId.getValue(),
        orderId: item.orderId,
        variantId: item.variantId,
        qty: item.quantity,
        productSnapshot: item.productSnapshot.getValue() as unknown as Prisma.InputJsonValue,
        isGift: item.isGift,
        giftMessage: item.giftMessage ?? null,
      })),
    });
  }

  async delete(orderItemId: OrderItemId): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id: orderItemId.getValue() },
    });
  }

  async deleteByOrderId(orderId: OrderId): Promise<void> {
    await this.prisma.orderItem.deleteMany({
      where: { orderId: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findById(orderItemId: OrderItemId): Promise<OrderItem | null> {
    const row = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId.getValue() },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(
    orderId: OrderId,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    return this.findMany({ orderId: orderId.getValue() }, options);
  }

  async findByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    return this.findMany({ variantId }, options);
  }

  async findGiftItems(orderId: OrderId): Promise<OrderItem[]> {
    return this.findMany({ orderId: orderId.getValue(), isGift: true }, undefined);
  }

  // ─── Counts / aggregates / existence ──────────────────────────────────────

  async countByOrderId(orderId: OrderId): Promise<number> {
    return this.prisma.orderItem.count({ where: { orderId: orderId.getValue() } });
  }

  async countByVariantId(variantId: string): Promise<number> {
    return this.prisma.orderItem.count({ where: { variantId } });
  }

  async getTotalQuantityByVariantId(variantId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: { variantId },
      _sum: { qty: true },
    });
    return result._sum.qty ?? 0;
  }

  async exists(orderItemId: OrderItemId): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: { id: orderItemId.getValue() },
    });
    return count > 0;
  }

  async existsByOrderIdAndVariantId(
    orderId: OrderId,
    variantId: string,
  ): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: { orderId: orderId.getValue(), variantId },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.OrderItemWhereInput,
    options: OrderItemQueryOptions | undefined,
  ): Promise<OrderItem[]> {
    const {
      limit,
      offset,
      sortBy = "id",
      sortOrder = "desc",
    } = options || {};

    const sortColumn = SORT_FIELD_MAP[sortBy];
    const orderBy = sortColumn ? { [sortColumn]: sortOrder } : undefined;

    const rows = await this.prisma.orderItem.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
    });

    return rows.map((r) => this.toEntity(r));
  }
}
