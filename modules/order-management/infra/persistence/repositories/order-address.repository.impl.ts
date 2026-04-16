import { PrismaClient } from "@prisma/client";
import { IOrderAddressRepository } from "../../../domain/repositories/order-address.repository";
import { OrderAddress } from "../../../domain/entities/order-address.entity";
import { AddressSnapshot } from "../../../domain/value-objects/address-snapshot.vo";

interface OrderAddressDatabaseRow {
  orderId: string;
  billingSnapshot: any;
  shippingSnapshot: any;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderAddressRepositoryImpl implements IOrderAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: OrderAddressDatabaseRow): OrderAddress {
    return OrderAddress.fromPersistence({
      orderId: row.orderId,
      billingAddress: AddressSnapshot.create(row.billingSnapshot),
      shippingAddress: AddressSnapshot.create(row.shippingSnapshot),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(orderAddress: OrderAddress): Promise<void> {
    const data = {
      billingSnapshot: orderAddress.billingAddress.getValue() as any,
      shippingSnapshot: orderAddress.shippingAddress.getValue() as any,
    };
    await this.prisma.orderAddress.upsert({
      where: { orderId: orderAddress.orderId },
      create: { orderId: orderAddress.orderId, ...data },
      update: data,
    });
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

    return this.toEntity(record as any);
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
