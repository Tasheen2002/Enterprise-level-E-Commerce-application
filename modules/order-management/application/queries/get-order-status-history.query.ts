import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderStatusHistoryDTO } from "../../domain/entities/order-status-history.entity";

export interface GetOrderStatusHistoryQuery extends IQuery {
  readonly orderId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetOrderStatusHistoryHandler implements IQueryHandler<GetOrderStatusHistoryQuery, OrderStatusHistoryDTO[]> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetOrderStatusHistoryQuery): Promise<OrderStatusHistoryDTO[]> {
    return this.orderService.getOrderStatusHistory(query.orderId, {
      limit: query.limit,
      offset: query.offset,
    });
  }
}
