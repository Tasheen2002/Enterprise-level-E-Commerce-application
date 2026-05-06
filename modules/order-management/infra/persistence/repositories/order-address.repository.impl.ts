import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IOrderAddressRepository } from "../../../domain/repositories/order-address.repository";
import { OrderAddress } from "../../../domain/entities/order-address.entity";
import {
  AddressSnapshot,
  AddressSnapshotData,
} from "../../../domain/value-objects/address-snapshot.vo";
import { OrderId } from "../../../domain/value-objects/order-id.vo";

type OrderAddressRow = Prisma.OrderAddressGetPayload<Record<string, never>>;

export class OrderAddressRepositoryImpl
  extends PrismaRepository<OrderAddress>
  implements IOrderAddressRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderAddressRow): OrderAddress {
    return OrderAddress.fromPersistence({
      orderId: row.orderId,
      billingAddress: AddressSnapshot.create(
        row.billingSnapshot as unknown as AddressSnapshotData,
      ),
      shippingAddress: AddressSnapshot.create(
        row.shippingSnapshot as unknown as AddressSnapshotData,
      ),
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(orderAddress: OrderAddress): Promise<void> {
    const data = {
      billingSnapshot: orderAddress.billingAddress.getValue() as unknown as Prisma.InputJsonValue,
      shippingSnapshot: orderAddress.shippingAddress.getValue() as unknown as Prisma.InputJsonValue,
    };
    await this.prisma.orderAddress.upsert({
      where: { orderId: orderAddress.orderId },
      create: { orderId: orderAddress.orderId, ...data },
      update: data,
    });

    await this.dispatchEvents(orderAddress);
  }

  async delete(orderId: OrderId): Promise<void> {
    await this.prisma.orderAddress.delete({
      where: { orderId: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findByOrderId(orderId: OrderId): Promise<OrderAddress | null> {
    const row = await this.prisma.orderAddress.findUnique({
      where: { orderId: orderId.getValue() },
    });
    return row ? this.toEntity(row) : null;
  }

  // ─── Existence ────────────────────────────────────────────────────────────

  async exists(orderId: OrderId): Promise<boolean> {
    const count = await this.prisma.orderAddress.count({
      where: { orderId: orderId.getValue() },
    });
    return count > 0;
  }
}
