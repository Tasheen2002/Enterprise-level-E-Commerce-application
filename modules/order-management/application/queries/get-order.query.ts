import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import { OrderNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetOrderQuery extends IQuery {
  readonly orderId?: string;
  readonly orderNumber?: string;
}

export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderDTO> {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  async handle(query: GetOrderQuery): Promise<OrderDTO> {
    const order = query.orderId
      ? await this.orderManagementService.getOrderById(query.orderId)
      : await this.orderManagementService.getOrderByNumber(query.orderNumber!);
    if (!order) throw new OrderNotFoundError(query.orderId ?? query.orderNumber ?? "");
    return order;
  }
}
