import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface ListOrdersQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly userId?: string;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly sortBy?: "createdAt" | "updatedAt" | "orderNumber";
  readonly sortOrder?: "asc" | "desc";
}

export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery, QueryResult<PaginatedResult<OrderDTO>>> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: ListOrdersQuery): Promise<QueryResult<PaginatedResult<OrderDTO>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.orderService.getAllOrders({
      page,
      limit,
      userId: query.userId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy ?? "createdAt",
      sortOrder: query.sortOrder ?? "desc",
    });
    return QueryResult.success<PaginatedResult<OrderDTO>>({
      items: result.items.map(Order.toDTO),
      total: result.totalCount,
      limit,
      offset: (page - 1) * limit,
      hasMore: (page - 1) * limit + result.items.length < result.totalCount,
    });
  }
}
