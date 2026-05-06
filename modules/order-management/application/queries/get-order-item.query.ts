import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderItemDTO } from "../../domain/entities/order-item.entity";
import {
  OrderItemNotFoundError,
  OrderNotFoundError,
} from "../../domain/errors/order-management.errors";

export interface GetOrderItemQuery extends IQuery {
  readonly orderId: string;
  readonly itemId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

// Reads through OrderManagementService.getOrderById so that ownership/staff
// auth runs in one place. The aggregate already contains items; we filter to
// the requested itemId and treat any cross-order access as not-found (don't
// leak the existence of items belonging to other orders).
export class GetOrderItemHandler implements IQueryHandler<GetOrderItemQuery, OrderItemDTO> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetOrderItemQuery): Promise<OrderItemDTO> {
    const order = await this.orderService.getOrderById(
      query.orderId,
      query.requestingUserId,
      query.isStaff,
    );
    if (!order) throw new OrderNotFoundError(query.orderId);

    const item = order.items.find((i) => i.orderItemId === query.itemId);
    if (!item) throw new OrderItemNotFoundError(query.itemId);
    return item;
  }
}
