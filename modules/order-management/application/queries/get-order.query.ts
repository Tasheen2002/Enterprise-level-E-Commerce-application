import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface GetOrderQuery extends IQuery {
  readonly orderId?: string;
  readonly orderNumber?: string;
}

export class GetOrderHandler implements IQueryHandler<GetOrderQuery, QueryResult<OrderDTO>> {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  async handle(query: GetOrderQuery): Promise<QueryResult<OrderDTO>> {
    const order: Order = query.orderId
      ? await this.orderManagementService.getOrderById(query.orderId)
      : await this.orderManagementService.getOrderByOrderNumber(query.orderNumber!);
    return QueryResult.success(Order.toDTO(order));
  }
}
