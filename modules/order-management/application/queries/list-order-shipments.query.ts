import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import { OrderNotFoundError } from "../../domain/errors/order-management.errors";

export interface ListOrderShipmentsQuery extends IQuery {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

export class ListOrderShipmentsHandler implements IQueryHandler<ListOrderShipmentsQuery, OrderShipmentDTO[]> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: ListOrderShipmentsQuery): Promise<OrderShipmentDTO[]> {
    const order = await this.orderService.getOrderById(
      query.orderId,
      query.requestingUserId,
      query.isStaff,
    );
    if (!order) throw new OrderNotFoundError(query.orderId);
    return order.shipments;
  }
}
