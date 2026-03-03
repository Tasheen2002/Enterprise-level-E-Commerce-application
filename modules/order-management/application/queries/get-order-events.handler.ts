import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetOrderEventsQuery,
  OrderEventResult,
} from "./get-order-events.query";
import { OrderEventService } from "../services/order-event.service";

export class GetOrderEventsHandler implements IQueryHandler<
  GetOrderEventsQuery,
  QueryResult<OrderEventResult[]>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    query: GetOrderEventsQuery,
  ): Promise<QueryResult<OrderEventResult[]>> {
    try {
      const options = {
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const events = query.eventType
        ? await this.orderEventService.getEventsByOrderAndType(
            query.orderId,
            query.eventType,
            options,
          )
        : await this.orderEventService.getEventsByOrderId(
            query.orderId,
            options,
          );

      // Convert entities to plain objects
      const results: OrderEventResult[] = events.map((event) => ({
        eventId: event.getEventId(),
        orderId: event.getOrderId(),
        eventType: event.getEventType(),
        payload: event.getPayload(),
        createdAt: event.getCreatedAt(),
      }));

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
