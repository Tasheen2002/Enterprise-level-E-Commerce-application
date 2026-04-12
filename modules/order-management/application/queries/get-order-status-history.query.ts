import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderStatusHistory, OrderStatusHistoryDTO } from "../../domain/entities/order-status-history.entity";

export interface GetOrderStatusHistoryQuery extends IQuery {
  readonly orderId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetOrderStatusHistoryHandler implements IQueryHandler<GetOrderStatusHistoryQuery, QueryResult<OrderStatusHistoryDTO[]>> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetOrderStatusHistoryQuery): Promise<QueryResult<OrderStatusHistoryDTO[]>> {
    const histories = await this.orderService.getOrderStatusHistory(query.orderId, {
      limit: query.limit,
      offset: query.offset,
    });
    return QueryResult.success(histories.map(OrderStatusHistory.toDTO));
  }
}
