import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderEventService } from "../services/order-event.service";

export interface OrderEventResult {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface GetOrderEventsQuery extends IQuery {
  orderId: string;
  eventType?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "eventId";
  sortOrder?: "asc" | "desc";
}

export class GetOrderEventsHandler implements IQueryHandler<
  GetOrderEventsQuery,
  QueryResult<OrderEventResult[]>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    query: GetOrderEventsQuery,
  ): Promise<QueryResult<OrderEventResult[]>> {
    try {
      if (!query.orderId || query.orderId.trim().length === 0) {
        return QueryResult.failure("Order ID is required");
      }

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
