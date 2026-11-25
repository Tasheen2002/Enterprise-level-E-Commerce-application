import { PrismaClient } from "@prisma/client";
import { IExternalOrderQueryPort } from "../../domain/external-services.js";

/** Read-only order data for customer care, from the order-management tables. */
export class PrismaCustomerCareOrderQuery implements IExternalOrderQueryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findOrderOwner(orderId: string): Promise<{ userId: string | null } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    return order ? { userId: order.userId } : null;
  }

  async findOrderItemIds(orderId: string): Promise<string[] | null> {
    const quantities = await this.findOrderItemQuantities(orderId);
    return quantities ? Object.keys(quantities) : null;
  }

  async findOrderItemQuantities(orderId: string): Promise<Record<string, number> | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { items: { select: { id: true, qty: true } } },
    });
    return order ? Object.fromEntries(order.items.map((item) => [item.id, item.qty])) : null;
  }
}
