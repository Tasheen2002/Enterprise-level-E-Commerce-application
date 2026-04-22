import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEventDTO } from "../../domain/entities/order-event.entity";
import { OrderEventQueryOptions } from "../../domain/repositories/order-event.repository";

export interface ListOrderEventsQuery extends IQuery {
  readonly orderId: string;
  readonly eventType?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "createdAt" | "eventId";
  readonly sortOrder?: "asc" | "desc";
}

export class ListOrderEventsHandler implements IQueryHandler<ListOrderEventsQuery, OrderEventDTO[]> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(query: ListOrderEventsQuery): Promise<OrderEventDTO[]> {
    const options: OrderEventQueryOptions = {
      limit: query.limit,
      offset: query.offset,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    return query.eventType
      ? this.orderEventService.getEventsByOrderAndType(query.orderId, query.eventType, options)
      : this.orderEventService.getEventsByOrderId(query.orderId, options);
  }
}
