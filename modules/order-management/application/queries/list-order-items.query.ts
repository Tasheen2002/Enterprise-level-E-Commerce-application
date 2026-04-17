import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderItemManagementService } from "../services/order-item-management.service";
import { OrderItem, OrderItemDTO } from "../../domain/entities/order-item.entity";

export interface ListOrderItemsQuery extends IQuery {
  readonly orderId: string;
}

export class ListOrderItemsHandler implements IQueryHandler<ListOrderItemsQuery, OrderItemDTO[]> {
  constructor(private readonly orderItemService: OrderItemManagementService) {}

  async handle(query: ListOrderItemsQuery): Promise<OrderItemDTO[]> {
    const items = await this.orderItemService.getOrderItemsByOrderId(query.orderId);
    return items.map(OrderItem.toDTO);
  }
}
