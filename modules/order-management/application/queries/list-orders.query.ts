import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";

export interface ListOrdersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly userId?: string;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly sortBy?: "createdAt" | "updatedAt" | "orderNumber";
  readonly sortOrder?: "asc" | "desc";
}

export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery, PaginatedResult<OrderDTO>> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: ListOrdersQuery): Promise<PaginatedResult<OrderDTO>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.orderService.findOrders(
      {
        userId: query.userId,
        status: query.status ? OrderStatus.fromString(query.status) : undefined,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      {
        limit,
        offset,
        sortBy: query.sortBy ?? "createdAt",
        sortOrder: query.sortOrder ?? "desc",
      },
    );
    return {
      items: result.items,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.items.length < result.total,
    };
  }
}
