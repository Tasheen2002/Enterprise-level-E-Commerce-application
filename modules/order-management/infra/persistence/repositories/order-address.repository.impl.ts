import { PrismaClient, Prisma } from "@prisma/client";
import { AddressSnapshotData } from "../../../domain/value-objects/address-snapshot.vo";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IOrderAddressRepository } from "../../../domain/repositories/order-address.repository";
import { OrderAddress } from "../../../domain/entities/order-address.entity";
import { AddressSnapshot } from "../../../domain/value-objects/address-snapshot.vo";

interface OrderAddressDatabaseRow {
  orderId: string;
  billingSnapshot: Prisma.JsonValue;
  shippingSnapshot: Prisma.JsonValue;
}

export class OrderAddressRepositoryImpl
  extends PrismaRepository<OrderAddress>
  implements IOrderAddressRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: OrderAddressDatabaseRow): OrderAddress {
    const fallbackDate = new Date(0);
    return OrderAddress.fromPersistence({
      orderId: row.orderId,
      billingAddress: AddressSnapshot.create(row.billingSnapshot as unknown as AddressSnapshotData),
      shippingAddress: AddressSnapshot.create(row.shippingSnapshot as unknown as AddressSnapshotData),
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    });
  }

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

  async delete(orderId: string): Promise<void> {
    await this.prisma.orderAddress.delete({
      where: {
        orderId,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<OrderAddress | null> {
    const record = await this.prisma.orderAddress.findUnique({
      where: {
        orderId,
      },
    });

    if (!record) {
      return null;
    }

    return this.toEntity(record);
  }

  async exists(orderId: string): Promise<boolean> {
    const count = await this.prisma.orderAddress.count({
      where: {
        orderId,
      },
    });

    return count > 0;
  }
}
