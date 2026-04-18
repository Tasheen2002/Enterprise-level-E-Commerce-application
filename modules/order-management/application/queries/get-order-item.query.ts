import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderItemManagementService } from "../services/order-item-management.service";
import { OrderItemDTO } from "../../domain/entities/order-item.entity";
import { OrderItemNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetOrderItemQuery extends IQuery {
  readonly itemId: string;
}

export class GetOrderItemHandler implements IQueryHandler<GetOrderItemQuery, OrderItemDTO> {
  constructor(private readonly orderItemService: OrderItemManagementService) {}

  async handle(query: GetOrderItemQuery): Promise<OrderItemDTO> {
    const item = await this.orderItemService.getOrderItemById(query.itemId);
    if (!item) throw new OrderItemNotFoundError(query.itemId);
    return item;
  }
}
