import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import {
  OrderNotFoundError,
  OrderShipmentNotFoundError,
} from "../../domain/errors/order-management.errors";

export interface GetShipmentQuery extends IQuery {
  readonly orderId: string;
  readonly shipmentId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

// Reads through OrderManagementService.getOrderById so ownership/staff auth
// runs in one place. The aggregate already contains shipments; we filter to
// the requested shipmentId. Cross-order access (shipment from a different
// order) surfaces as not-found rather than 403 — don't leak the existence
// of shipments belonging to other orders.
export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery, OrderShipmentDTO> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetShipmentQuery): Promise<OrderShipmentDTO> {
    const order = await this.orderService.getOrderById(
      query.orderId,
      query.requestingUserId,
      query.isStaff,
    );
    if (!order) throw new OrderNotFoundError(query.orderId);

    const shipment = order.shipments.find((s) => s.shipmentId === query.shipmentId);
    if (!shipment) throw new OrderShipmentNotFoundError(query.shipmentId);
    return shipment;
  }
}
