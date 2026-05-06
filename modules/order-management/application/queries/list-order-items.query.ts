import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderItemDTO } from "../../domain/entities/order-item.entity";
import { OrderNotFoundError } from "../../domain/errors/order-management.errors";

export interface ListOrderItemsQuery extends IQuery {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}
export class ListOrderItemsHandler implements IQueryHandler<ListOrderItemsQuery, OrderItemDTO[]> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: ListOrderItemsQuery): Promise<OrderItemDTO[]> {
    const order = await this.orderService.getOrderById(
      query.orderId,
      query.requestingUserId,
      query.isStaff,
    );
    if (!order) throw new OrderNotFoundError(query.orderId);
    return order.items;
  }
}
