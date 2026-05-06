import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../domain/constants/order-management.constants";

export interface ListOrdersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  // Staff-only filter — non-staff requesters always have userId forced to
  // requestingUserId in the service layer regardless of what's passed here.
  readonly userId?: string;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly sortBy?: "createdAt" | "updatedAt" | "orderNumber";
  readonly sortOrder?: "asc" | "desc";
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery, PaginatedResult<OrderDTO>> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: ListOrdersQuery): Promise<PaginatedResult<OrderDTO>> {
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE));
    const offset = Math.max(MIN_OFFSET, query.offset ?? MIN_OFFSET);

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
      query.requestingUserId,
      query.isStaff,
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
