import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderItemManagementService } from "../services/order-item-management.service";
import { OrderItem, OrderItemDTO } from "../../domain/entities/order-item.entity";

export interface GetOrderItemQuery extends IQuery {
  readonly itemId: string;
}

export class GetOrderItemHandler implements IQueryHandler<GetOrderItemQuery, QueryResult<OrderItemDTO>> {
  constructor(private readonly orderItemService: OrderItemManagementService) {}

  async handle(query: GetOrderItemQuery): Promise<QueryResult<OrderItemDTO>> {
    const item = await this.orderItemService.getOrderItemById(query.itemId);
    return QueryResult.success(OrderItem.toDTO(item));
  }
}
