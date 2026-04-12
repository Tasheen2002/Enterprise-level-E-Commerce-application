import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderItemManagementService } from "../services/order-item-management.service";
import { OrderItem, OrderItemDTO } from "../../domain/entities/order-item.entity";

export interface ListOrderItemsQuery extends IQuery {
  readonly orderId: string;
}

export class ListOrderItemsHandler implements IQueryHandler<ListOrderItemsQuery, QueryResult<OrderItemDTO[]>> {
  constructor(private readonly orderItemService: OrderItemManagementService) {}

  async handle(query: ListOrderItemsQuery): Promise<QueryResult<OrderItemDTO[]>> {
    const items = await this.orderItemService.getOrderItemsByOrderId(query.orderId);
    return QueryResult.success(items.map(OrderItem.toDTO));
  }
}
