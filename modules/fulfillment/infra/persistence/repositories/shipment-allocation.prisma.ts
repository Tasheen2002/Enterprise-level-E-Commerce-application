import { PrismaClient } from "@prisma/client";
import {
  IShipmentAllocationPort,
  OrderLineAllocation,
} from "../../../domain/repositories/shipment-allocation.port";

export class PrismaShipmentAllocation implements IShipmentAllocationPort {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrderLines(
    orderId: string,
    excludeShipmentId?: string,
  ): Promise<Map<string, OrderLineAllocation> | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { items: { select: { id: true, qty: true } } },
    });
    if (!order) return null;

    const allocated = await this.prisma.shipmentItem.groupBy({
      by: ["orderItemId"],
      where: {
        orderItemId: { in: order.items.map((item) => item.id) },
        shipment: {
          status: { not: "failed" },
          ...(excludeShipmentId ? { shipmentId: { not: excludeShipmentId } } : {}),
        },
      },
      _sum: { qty: true },
    });
    const allocatedByItem = new Map(allocated.map((row) => [row.orderItemId, row._sum.qty ?? 0]));

    return new Map(
      order.items.map((item) => [
        item.id,
        { orderedQty: item.qty, allocatedQty: allocatedByItem.get(item.id) ?? 0 },
      ]),
    );
  }
}
