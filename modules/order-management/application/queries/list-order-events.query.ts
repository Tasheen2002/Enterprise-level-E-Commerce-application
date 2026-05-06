import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEventDTO } from "../../domain/entities/order-event.entity";
import { OrderEventQueryOptions } from "../../domain/repositories/order-event.repository";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../domain/constants/order-management.constants";

export interface ListOrderEventsQuery extends IQuery {
  readonly orderId: string;
  readonly eventType?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "createdAt" | "eventId";
  readonly sortOrder?: "asc" | "desc";
}

// FLAG: returns flat array — does not provide total/hasMore. For high-volume
// orders (many events) clients can't tell when they've reached the end.
// Consider wrapping in PaginatedResult<OrderEventDTO> if pagination becomes
// load-bearing.
export class ListOrderEventsHandler implements IQueryHandler<ListOrderEventsQuery, OrderEventDTO[]> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(query: ListOrderEventsQuery): Promise<OrderEventDTO[]> {
    const options: OrderEventQueryOptions = {
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      offset: Math.max(MIN_OFFSET, query.offset ?? MIN_OFFSET),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    return query.eventType
      ? this.orderEventService.getEventsByOrderAndType(query.orderId, query.eventType, options)
      : this.orderEventService.getEventsByOrderId(query.orderId, options);
  }
}
