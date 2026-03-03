import { PrismaClient } from "@prisma/client";
import { IOrderAddressRepository } from "../../../domain/repositories/order-address.repository";
import { OrderAddress } from "../../../domain/entities/order-address.entity";
import { AddressSnapshot } from "../../../domain/value-objects/address-snapshot.vo";

export class OrderAddressRepositoryImpl implements IOrderAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(orderAddress: OrderAddress): Promise<void> {
    await this.prisma.orderAddress.create({
      data: {
        orderId: orderAddress.getOrderId(),
        billingSnapshot: orderAddress.getBillingAddress().toJSON() as any,
        shippingSnapshot: orderAddress.getShippingAddress().toJSON() as any,
      },
    });
  }

  async update(orderAddress: OrderAddress): Promise<void> {
    await this.prisma.orderAddress.update({
      where: {
        orderId: orderAddress.getOrderId(),
      },
      data: {
        billingSnapshot: orderAddress.getBillingAddress().toJSON() as any,
        shippingSnapshot: orderAddress.getShippingAddress().toJSON() as any,
      },
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

    return OrderAddress.reconstitute({
      orderId: record.orderId,
      billingAddress: AddressSnapshot.create(record.billingSnapshot as any),
      shippingAddress: AddressSnapshot.create(record.shippingSnapshot as any),
    });
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
